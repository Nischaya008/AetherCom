import { v4 as uuidv4 } from 'uuid';
import {
  addPendingAction as dbAddPendingAction,
  getPendingActions,
  removePendingAction
} from './db.js';

// Re-export addPendingAction for convenience
export const addPendingAction = dbAddPendingAction;

// Use relative URL in production (same domain), or env variable for dev, or localhost fallback
const API_BASE_URL = import.meta.env.PROD 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

// Queue action types
export const ACTION_TYPES = {
  ADD_TO_CART: 'ADD',
  REMOVE_FROM_CART: 'REMOVE',
  CHECKOUT: 'CHECKOUT'
};

// Create action object
export const createAction = (type, payload) => {
  return {
    id: uuidv4(),
    type,
    payload,
    timestamp: Date.now()
  };
};

// Replay pending actions
// Track which actions are currently being processed to prevent duplicates
const processingActions = new Set();

export const replayPendingActions = async () => {
  const actions = await getPendingActions();
  
  // Filter out actions that are already being processed
  const actionsToProcess = actions.filter(action => !processingActions.has(action.id));
  
  if (actionsToProcess.length === 0) {
    console.log('No new actions to replay');
    return;
  }
  
  console.log(`Replaying ${actionsToProcess.length} pending action(s)...`);
  
  for (const action of actionsToProcess) {
    // Mark as processing immediately to prevent duplicate processing
    processingActions.add(action.id);
    
    try {
      let success = false;

      switch (action.type) {
        case ACTION_TYPES.ADD_TO_CART:
          // Already handled locally, just remove if online
          success = true;
          break;

        case ACTION_TYPES.REMOVE_FROM_CART:
          // Already handled locally, just remove if online
          success = true;
          break;

        case ACTION_TYPES.CHECKOUT:
          success = await processCheckout(action);
          break;

        default:
          console.warn('Unknown action type:', action.type);
          success = true; // Remove unknown actions
      }

      if (success) {
        await removePendingAction(action.id);
        console.log(`Successfully processed action ${action.id}`);
      }
    } catch (error) {
      console.error('Error replaying action:', error);
      // Keep action in queue for retry, but remove from processing set
      // so it can be retried later
    } finally {
      // Remove from processing set after completion (success or failure)
      processingActions.delete(action.id);
    }
  }
};

// Process checkout action
const processCheckout = async (action) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        clientActionId: action.payload.clientActionId,
        lineItems: action.payload.lineItems,
        totalPrice: action.payload.totalPrice,
        shippingAddress: action.payload.shippingAddress,
        email: action.payload.email
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Handle duplicate orders (idempotency)
      if (data.isDuplicate && data.order) {
        console.log('Order already processed (duplicate), using existing order');
        const { saveOrder, getOrder, removeOrder } = await import('./db.js');
        const tempOrderId = `temp-${action.payload.clientActionId}`;
        const tempOrder = await getOrder(tempOrderId);
        if (tempOrder) {
          // Replace temp order with existing order
          await saveOrder(data.order);
          await removeOrder(tempOrderId);
        } else {
          await saveOrder(data.order);
        }
        return true; // Success - order already exists
      }
      
      // Update the temp order with the real order data
      if (data.order) {
        const { saveOrder, getOrder, removeOrder, clearProducts } = await import('./db.js');
        const tempOrderId = `temp-${action.payload.clientActionId}`;
        const tempOrder = await getOrder(tempOrderId);
        if (tempOrder) {
          // Replace temp order with real order
          await saveOrder(data.order);
          // Remove temp order
          await removeOrder(tempOrderId);
        } else {
          await saveOrder(data.order);
        }
        
        // Clear products cache to force refresh of stock levels
        // This ensures stock counts are updated after order sync
        if (clearProducts) {
          await clearProducts().catch(console.error);
        }
      }
      return true;
    } else if (response.status === 400) {
      // Handle reconciliation
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
};

// Check online status
export const isOnline = () => {
  return navigator.onLine;
};

// Setup online/offline listeners
export const setupConnectivityListeners = (onOnline, onOffline) => {
  window.addEventListener('online', () => {
    console.log('Online event detected');
    onOnline?.();
  });

  window.addEventListener('offline', () => {
    console.log('Offline mode');
    onOffline?.();
  });
};

