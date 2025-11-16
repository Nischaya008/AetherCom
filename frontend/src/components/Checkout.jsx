import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { createOrder, validateCart } from '../utils/api.js';
import { createAction, addPendingAction, ACTION_TYPES, isOnline } from '../utils/queue.js';
import { clearCart, saveOrder } from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

export const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart: clearCartContext } = useCart();
  const [formData, setFormData] = useState({
    email: '',
    shippingAddress: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [reconciliation, setReconciliation] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    // Don't redirect if we're submitting or have just placed an order
    if (cart.length === 0 && !submitting && !orderPlaced) {
      navigate('/cart');
    }
  }, [cart, navigate, submitting, orderPlaced]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!formData.shippingAddress || formData.shippingAddress.trim().length < 10) {
      newErrors.shippingAddress = 'Shipping address must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validate cart if online
    if (isOnline()) {
      try {
        const validation = await validateCart(
          cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        );

        if (validation.hasChanges) {
          setReconciliation(validation);
          return;
        }
      } catch (error) {
        console.error('Cart validation error:', error);
        alert('Error validating cart. Please try again.');
        return;
      }
    }

    setSubmitting(true);

    const clientActionId = uuidv4();
    const orderData = {
      clientActionId,
      lineItems: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name, // Include product name for offline display
        imageURL: item.imageURL // Include product image for offline display
      })),
      totalPrice: getCartTotal(),
      shippingAddress: formData.shippingAddress,
      email: formData.email
    };

    try {
      if (isOnline()) {
        // Try to create order online
        try {
          const result = await createOrder(orderData);
          // Save order locally
          await saveOrder(result.order);
          // Save email for order history
          localStorage.setItem('orderEmail', formData.email);
          // Mark order as placed to prevent redirect
          setOrderPlaced(true);
          // Success - clear cart and redirect
          await clearCart();
          clearCartContext();
          navigate(`/order-success/${result.order._id}`);
        } catch (error) {
          // Handle reconciliation errors
          if (error.status === 400 && error.adjustedItems) {
            setReconciliation(error);
            setSubmitting(false);
            return;
          }
          // Network error - queue for offline
          throw error;
        }
      } else {
        // Offline - queue the action and save order locally
        const action = createAction(ACTION_TYPES.CHECKOUT, orderData);
        await addPendingAction(action);
        
        // Optimistically update product stock in cache
        const { getProduct, saveProducts } = await import('../utils/db.js');
        for (const item of orderData.lineItems) {
          try {
            const cachedProduct = await getProduct(item.productId);
            if (cachedProduct && cachedProduct.stock !== undefined) {
              // Update stock optimistically
              cachedProduct.stock = Math.max(0, cachedProduct.stock - item.quantity);
              await saveProducts([cachedProduct]);
            }
          } catch (error) {
            console.error('Error updating cached product stock:', error);
            // Continue with other products
          }
        }
        
        // Create a temporary order object for offline display
        const tempOrder = {
          _id: `temp-${orderData.clientActionId}`,
          clientActionId: orderData.clientActionId,
          lineItems: orderData.lineItems,
          totalPrice: orderData.totalPrice,
          shippingAddress: orderData.shippingAddress,
          email: orderData.email,
          status: 'pending',
          createdAt: new Date().toISOString(),
          isOffline: true
        };
        
        // Save order to IndexedDB for offline viewing
        await saveOrder(tempOrder);
        
        // Mark order as placed to prevent redirect
        setOrderPlaced(true);
        // Clear cart optimistically
        await clearCart();
        clearCartContext();
        navigate('/order-queued');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error processing order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReconciliationConfirm = async () => {
    navigate('/cart');
  };

  if (reconciliation) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: '#fafafa',
        minHeight: '100vh'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '3rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: '700',
            marginBottom: '1.5rem',
            color: '#1a1a1a'
          }}>
            Order Needs Update
          </h1>
          <div
            style={{
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}
          >
            <h3 style={{
              marginTop: 0,
              marginBottom: '1rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#856404'
            }}>
              Changes Detected
            </h3>
            {reconciliation.adjustedItems?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#856404' }}>
                  Some items have changed:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404' }}>
                  {reconciliation.adjustedItems.map(item => (
                    <li key={item.productId} style={{ marginBottom: '0.25rem' }}>
                      <strong>{item.name}</strong>: {item.requestedQuantity} → {item.adjustedQuantity}, 
                      ${item.oldPrice?.toFixed(2)} → ${item.newPrice?.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reconciliation.removedItems?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#856404' }}>
                  Some items are no longer available:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404' }}>
                  {reconciliation.removedItems.map(item => (
                    <li key={item.productId} style={{ marginBottom: '0.25rem' }}>
                      <strong>{item.name}</strong>: {item.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p style={{
              margin: '1rem 0 0 0',
              fontWeight: '600',
              color: '#856404',
              fontSize: '1.1rem'
            }}>
              New Total: <strong>${reconciliation.newTotalPrice?.toFixed(2)}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleReconciliationConfirm}
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5568d3';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Update Cart and Retry
            </button>
            <button
              onClick={() => setReconciliation(null)}
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eeeeee';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/cart"
          style={{
            color: '#667eea',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <span>←</span> Back to Cart
        </Link>
      </div>

      <h1 style={{
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        fontWeight: '700',
        marginBottom: '2rem',
        color: '#1a1a1a',
        letterSpacing: '-0.02em'
      }}>
        Checkout
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '3rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '3rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            marginTop: 0,
            marginBottom: '2rem',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Shipping Information
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontWeight: '600',
                color: '#333',
                fontSize: '1rem'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: errors.email ? '2px solid #f44336' : '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  if (!errors.email) {
                    e.currentTarget.style.borderColor = '#667eea';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.email) {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }
                }}
              />
              {errors.email && (
                <span style={{
                  color: '#f44336',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                  display: 'block'
                }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontWeight: '600',
                color: '#333',
                fontSize: '1rem'
              }}>
                Shipping Address
              </label>
              <textarea
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                placeholder="Enter your complete shipping address..."
                rows="5"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: errors.shippingAddress ? '2px solid #f44336' : '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'border-color 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  if (!errors.shippingAddress) {
                    e.currentTarget.style.borderColor = '#667eea';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.shippingAddress) {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }
                }}
              />
              {errors.shippingAddress && (
                <span style={{
                  color: '#f44336',
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                  display: 'block'
                }}>
                  {errors.shippingAddress}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '1.125rem',
                backgroundColor: submitting ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: submitting ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = '#5568d3';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.backgroundColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {submitting ? 'Processing Order...' : 'Place Order'}
            </button>
          </form>
        </div>

        <div>
          <div
            style={{
              padding: '2rem',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              position: 'sticky',
              top: '120px'
            }}
          >
            <h2 style={{
              marginTop: 0,
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              Order Summary
            </h2>
            <div style={{ marginBottom: '1.5rem' }}>
              {cart.map(item => (
                <div
                  key={item.productId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 0.25rem 0',
                      fontWeight: '500',
                      color: '#333',
                      fontSize: '0.95rem'
                    }}>
                      {item.name}
                    </p>
                    <p style={{
                      margin: 0,
                      color: '#666',
                      fontSize: '0.875rem'
                    }}>
                      Qty: {item.quantity} × ${item.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <span style={{
                    fontWeight: '600',
                    color: '#1a1a1a',
                    fontSize: '1rem'
                  }}>
                    ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <hr style={{
              border: 'none',
              borderTop: '2px solid #f0f0f0',
              margin: '1.5rem 0'
            }} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '1rem',
              color: '#666'
            }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: '500', color: '#333' }}>
                ${getCartTotal().toFixed(2)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              fontSize: '1rem',
              color: '#666'
            }}>
              <span>Shipping:</span>
              <span style={{ fontWeight: '500', color: '#4caf50' }}>Free</span>
            </div>
            <hr style={{
              border: 'none',
              borderTop: '2px solid #f0f0f0',
              margin: '1.5rem 0'
            }} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              <span>Total:</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
