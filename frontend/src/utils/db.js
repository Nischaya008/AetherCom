import { openDB, deleteDB } from 'idb';

const DB_NAME = 'pwa-store-db';
const DB_VERSION = 3;

const STORES = {
  CART: 'cart',
  PENDING_ACTIONS: 'pendingActions',
  ORDERS: 'orders',
  PRODUCTS: 'products',
  CATEGORIES: 'categories'
};

// Initialize IndexedDB with persistence
export const initDB = async () => {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Handle version upgrades
        console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`);
        
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

        // Products store - for offline access (added in version 3)
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productsStore = db.createObjectStore(STORES.PRODUCTS, {
            keyPath: '_id'
          });
          productsStore.createIndex('name', 'name');
          productsStore.createIndex('categoryId', 'categoryId');
        }

        // Categories store - for offline access (added in version 3)
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          const categoriesStore = db.createObjectStore(STORES.CATEGORIES, {
            keyPath: '_id'
          });
          categoriesStore.createIndex('name', 'name');
        }
      }
    });
    return db;
  } catch (error) {
    // Handle version errors - if version mismatch, try to delete and recreate
    if (error.name === 'VersionError') {
      console.warn('IndexedDB version mismatch. Clearing old database...');
      try {
        // Delete the old database
        await deleteDB(DB_NAME);
        // Try again with fresh database
        return await openDB(DB_NAME, DB_VERSION, {
          upgrade(db, oldVersion, newVersion, transaction) {
            console.log(`Creating new IndexedDB version ${newVersion}`);
            
            // Cart store
            const cartStore = db.createObjectStore(STORES.CART, {
              keyPath: 'productId'
            });
            cartStore.createIndex('productId', 'productId', { unique: true });

            // Pending actions store
            const actionsStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
              keyPath: 'id'
            });
            actionsStore.createIndex('timestamp', 'timestamp');
            actionsStore.createIndex('type', 'type');

            // Orders store
            const ordersStore = db.createObjectStore(STORES.ORDERS, {
              keyPath: '_id'
            });
            ordersStore.createIndex('createdAt', 'createdAt');
            ordersStore.createIndex('email', 'email');
            ordersStore.createIndex('status', 'status');

            // Products store
            const productsStore = db.createObjectStore(STORES.PRODUCTS, {
              keyPath: '_id'
            });
            productsStore.createIndex('name', 'name');
            productsStore.createIndex('categoryId', 'categoryId');

            // Categories store
            const categoriesStore = db.createObjectStore(STORES.CATEGORIES, {
              keyPath: '_id'
            });
            categoriesStore.createIndex('name', 'name');
          }
        });
      } catch (retryError) {
        console.error('Error recreating IndexedDB:', retryError);
        throw retryError;
      }
    }
    throw error;
  }
  
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

export const removeOrder = async (orderId) => {
  const db = await initDB();
  const tx = db.transaction(STORES.ORDERS, 'readwrite');
  const store = tx.objectStore(STORES.ORDERS);
  await store.delete(orderId);
};

// Products operations
export const saveProducts = async (products) => {
  const db = await initDB();
  const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
  const store = tx.objectStore(STORES.PRODUCTS);
  for (const product of products) {
    await store.put(product);
  }
  return products;
};

export const getProducts = async () => {
  const db = await initDB();
  const tx = db.transaction(STORES.PRODUCTS, 'readonly');
  const store = tx.objectStore(STORES.PRODUCTS);
  return await store.getAll();
};

export const getProduct = async (productId) => {
  const db = await initDB();
  const tx = db.transaction(STORES.PRODUCTS, 'readonly');
  const store = tx.objectStore(STORES.PRODUCTS);
  return await store.get(productId);
};

// Categories operations
export const saveCategories = async (categories) => {
  const db = await initDB();
  const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
  const store = tx.objectStore(STORES.CATEGORIES);
  for (const category of categories) {
    await store.put(category);
  }
  return categories;
};

export const getCategories = async () => {
  const db = await initDB();
  const tx = db.transaction(STORES.CATEGORIES, 'readonly');
  const store = tx.objectStore(STORES.CATEGORIES);
  return await store.getAll();
};

export { STORES };

