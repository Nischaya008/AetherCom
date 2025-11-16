import { createContext, useContext, useState, useEffect } from 'react';
import {
  getCart,
  addToCart as dbAddToCart,
  updateCartItem as dbUpdateCartItem,
  removeFromCart as dbRemoveFromCart,
  clearCart as dbClearCart
} from '../utils/db.js';
import { isOnline } from '../utils/queue.js';
import { validateCart } from '../utils/api.js';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart from IndexedDB on mount
  useEffect(() => {
    loadCart();
    
    // Reload cart when coming back online to sync any changes
    const handleOnlineSync = () => {
      loadCart();
    };
    
    window.addEventListener('online-sync-complete', handleOnlineSync);
    
    return () => {
      window.removeEventListener('online-sync-complete', handleOnlineSync);
    };
  }, []);

  const loadCart = async () => {
    try {
      const cartItems = await getCart();
      setCart(cartItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    try {
      console.log('Adding product to cart:', product);
      const productId = String(product._id || product.id);
      const updatedCart = await dbAddToCart({
        productId: productId,
        quantity: 1,
        price: product.price,
        name: product.name,
        imageURL: product.imageURL
      });
      console.log('Updated cart from IndexedDB:', updatedCart);
      setCart(updatedCart);
      console.log('Product added to cart. Cart items:', updatedCart.length);
      console.log('Total items in cart:', updatedCart.reduce((sum, item) => sum + item.quantity, 0));

      // Don't validate on every add - validation happens when viewing cart
      // This prevents unnecessary reconciliation messages
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
      throw error;
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      const updatedCart = await dbUpdateCartItem(productId, quantity);
      setCart(updatedCart);

      // Validate if online (non-blocking)
      if (isOnline()) {
        setTimeout(async () => {
          try {
            const validation = await validateCart(updatedCart.map(item => ({
              productId: String(item.productId),
              quantity: item.quantity
            })));
            
            if (validation.hasChanges) {
              handleReconciliation(validation, updatedCart);
            }
          } catch (error) {
            console.error('Cart validation error (non-blocking):', error);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const updatedCart = await dbRemoveFromCart(productId);
      setCart(updatedCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await dbClearCart();
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const handleReconciliation = async (validation, currentCart = null) => {
    // Use currentCart if provided, otherwise use state cart
    const cartToReconcile = currentCart || cart;
    
    // Update cart with server state
    const reconciledCart = cartToReconcile.map(item => {
      const itemId = String(item.productId);
      const adjusted = validation.adjustedItems?.find(
        adj => String(adj.productId) === itemId
      );
      if (adjusted) {
        return {
          ...item,
          quantity: adjusted.adjustedQuantity,
          price: adjusted.newPrice
        };
      }
      return item;
    }).filter(item => {
      // Remove items that were removed by server
      const itemId = String(item.productId);
      return !validation.removedItems?.some(
        removed => String(removed.productId) === itemId
      );
    });

    // Update IndexedDB with reconciled cart
    try {
      await dbClearCart();
      for (const item of reconciledCart) {
        await dbAddToCart(item);
      }
      const finalCart = await getCart();
      setCart(finalCart);
      console.log('Cart reconciled. New cart:', finalCart);
    } catch (error) {
      console.error('Error reconciling cart:', error);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    reloadCart: loadCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

