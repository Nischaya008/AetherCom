import { v4 as uuidv4 } from 'uuid';
import {
  addPendingAction as dbAddPendingAction,
  getPendingActions,
  removePendingAction
} from './db.js';

// Re-export addPendingAction for convenience
export const addPendingAction = dbAddPendingAction;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
export const replayPendingActions = async () => {
  const actions = await getPendingActions();
  
  for (const action of actions) {
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
      }
    } catch (error) {
      console.error('Error replaying action:', error);
      // Keep action in queue for retry
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
    console.log('Online - replaying pending actions');
    replayPendingActions().catch(console.error);
    onOnline?.();
  });

  window.addEventListener('offline', () => {
    console.log('Offline mode');
    onOffline?.();
  });
};

