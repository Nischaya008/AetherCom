import { openDB } from 'idb';

const DB_NAME = 'pwa-store-db';
const DB_VERSION = 2;

const STORES = {
  CART: 'cart',
  PENDING_ACTIONS: 'pendingActions',
  ORDERS: 'orders'
};

// Initialize IndexedDB with persistence
export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Cart store - persists indefinitely (until user clears browser data)
      if (!db.objectStoreNames.contains(STORES.CART)) {
        const cartStore = db.createObjectStore(STORES.CART, {
          keyPath: 'productId'
        });
        cartStore.createIndex('productId', 'productId', { unique: true });
      }

      // Pending actions store - persists indefinitely (until user clears browser data)
      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        const actionsStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
          keyPath: 'id'
        });
        actionsStore.createIndex('timestamp', 'timestamp');
        actionsStore.createIndex('type', 'type');
      }

      // Orders store - persists indefinitely
      if (!db.objectStoreNames.contains(STORES.ORDERS)) {
        const ordersStore = db.createObjectStore(STORES.ORDERS, {
          keyPath: '_id'
        });
        ordersStore.createIndex('createdAt', 'createdAt');
        ordersStore.createIndex('email', 'email');
        ordersStore.createIndex('status', 'status');
      }
    }
  });
  
  // IndexedDB persists across browser sessions by default
  // Data persists until:
  // - User explicitly clears browser data
  // - Browser storage quota is exceeded (very unlikely)
  // - User clears site data
  // Data will persist for weeks/months by default
  
  return db;
};

// Cart operations
export const getCart = async () => {
  const db = await initDB();
  const tx = db.transaction(STORES.CART, 'readonly');
  const store = tx.objectStore(STORES.CART);
  return await store.getAll();
};

export const addToCart = async (item) => {
  const db = await initDB();
  const tx = db.transaction(STORES.CART, 'readwrite');
  const store = tx.objectStore(STORES.CART);

  // Ensure productId is a string for consistent comparison
  const productId = String(item.productId);
  
  const existing = await store.get(productId);
  if (existing) {
    existing.quantity += item.quantity || 1;
    existing.price = item.price; // Update price in case it changed
    await store.put(existing);
  } else {
    await store.add({
      productId: productId,
      quantity: item.quantity || 1,
      price: item.price,
      name: item.name,
      imageURL: item.imageURL
    });
  }
  const allItems = await store.getAll();
  return allItems;
};

export const updateCartItem = async (productId, quantity) => {
  const db = await initDB();
  const tx = db.transaction(STORES.CART, 'readwrite');
  const store = tx.objectStore(STORES.CART);

  if (quantity <= 0) {
    await store.delete(productId);
  } else {
    const item = await store.get(productId);
    if (item) {
      item.quantity = quantity;
      await store.put(item);
    }
  }
  return await store.getAll();
};

export const removeFromCart = async (productId) => {
  const db = await initDB();
  const tx = db.transaction(STORES.CART, 'readwrite');
  const store = tx.objectStore(STORES.CART);
  await store.delete(productId);
  return await store.getAll();
};

export const clearCart = async () => {
  const db = await initDB();
  const tx = db.transaction(STORES.CART, 'readwrite');
  const store = tx.objectStore(STORES.CART);
  await store.clear();
  return [];
};

// Pending actions operations
export const addPendingAction = async (action) => {
  const db = await initDB();
  const tx = db.transaction(STORES.PENDING_ACTIONS, 'readwrite');
  const store = tx.objectStore(STORES.PENDING_ACTIONS);
  await store.add(action);
  return action;
};

export const getPendingActions = async () => {
  const db = await initDB();
  const tx = db.transaction(STORES.PENDING_ACTIONS, 'readonly');
  const store = tx.objectStore(STORES.PENDING_ACTIONS);
  const index = store.index('timestamp');
  return await index.getAll();
};

export const removePendingAction = async (actionId) => {
  const db = await initDB();
  const tx = db.transaction(STORES.PENDING_ACTIONS, 'readwrite');
  const store = tx.objectStore(STORES.PENDING_ACTIONS);
  await store.delete(actionId);
};

export const clearPendingActions = async () => {
  const db = await initDB();
  const tx = db.transaction(STORES.PENDING_ACTIONS, 'readwrite');
  const store = tx.objectStore(STORES.PENDING_ACTIONS);
  await store.clear();
};

// Orders operations
export const saveOrder = async (order) => {
  const db = await initDB();
  const tx = db.transaction(STORES.ORDERS, 'readwrite');
  const store = tx.objectStore(STORES.ORDERS);
  await store.put(order);
  return order;
};

export const getOrders = async () => {
  const db = await initDB();
  const tx = db.transaction(STORES.ORDERS, 'readonly');
  const store = tx.objectStore(STORES.ORDERS);
  const index = store.index('createdAt');
  return await index.getAll().then(orders => orders.reverse()); // Most recent first
};

export const getOrder = async (orderId) => {
  const db = await initDB();
  const tx = db.transaction(STORES.ORDERS, 'readonly');
  const store = tx.objectStore(STORES.ORDERS);
  return await store.get(orderId);
};

export { STORES };

