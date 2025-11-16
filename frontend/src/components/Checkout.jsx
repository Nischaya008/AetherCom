import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { createOrder, validateCart } from '../utils/api.js';
import { createAction, addPendingAction, ACTION_TYPES, isOnline } from '../utils/queue.js';
import { clearCart, saveOrder } from '../utils/db.js';
import { getCurrentAddress } from '../utils/geocoding.js';
import { v4 as uuidv4 } from 'uuid';

export const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart: clearCartContext } = useCart();
  const [formData, setFormData] = useState({
    email: '',
    shippingAddress: '',
    // Manual address fields for offline
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [address, setAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [addressError, setAddressError] = useState(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
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

  // Auto-detect location on mount (only if online)
  useEffect(() => {
    // If offline, skip location detection and allow manual entry
    if (!isOnline()) {
      setLoadingAddress(false);
      setUseManualAddress(true);
      return;
    }

    const fetchAddress = async () => {
      setLoadingAddress(true);
      setAddressError(null);
      
      try {
        const currentAddress = await getCurrentAddress();
        setAddress(currentAddress);
        // Set shipping address to formatted address
        setFormData(prev => ({
          ...prev,
          shippingAddress: currentAddress.formatted
        }));
      } catch (error) {
        // Only log error if we're actually online (expected to fail offline)
        if (navigator.onLine) {
          console.error('Error fetching address:', error);
        }
        setAddressError(error.message);
        // If location fails, allow manual entry
        setUseManualAddress(true);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddress();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    // Validate address based on mode
    if (useManualAddress) {
      // Manual address validation
      if (!formData.street || formData.street.trim().length < 5) {
        newErrors.street = 'Street address is required (at least 5 characters)';
      }
      if (!formData.city || formData.city.trim().length < 2) {
        newErrors.city = 'City is required';
      }
      if (!formData.country || formData.country.trim().length < 2) {
        newErrors.country = 'Country is required';
      }
      // Build formatted address from manual fields
      const addressParts = [
        formData.street,
        formData.city,
        formData.state,
        formData.postalCode,
        formData.country
      ].filter(Boolean);
      formData.shippingAddress = addressParts.join(', ');
    } else {
      // Automatic address validation
      if (!address || !formData.shippingAddress || formData.shippingAddress.trim().length < 10) {
        newErrors.shippingAddress = 'Please enable location permissions to continue';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validate cart if online (skip if network fails - proceed with checkout)
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
        // If network error, silently skip validation and proceed
        // This allows checkout to work even if validation endpoint is unreachable
        if (error.message?.includes('fetch') || error.message?.includes('network') || !navigator.onLine) {
          console.log('Cart validation skipped due to network issue, proceeding with checkout');
          // Continue with checkout - validation will happen on server if order is created
        } else {
          // Only show error for non-network issues
          console.error('Cart validation error:', error);
          alert('Error validating cart. Please try again.');
          return;
        }
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
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <label style={{
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '1rem'
                }}>
                  Shipping Address
                </label>
                {loadingAddress && !useManualAddress && (
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#667eea',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: '2px solid #667eea',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Detecting location...
                  </span>
                )}
                {useManualAddress && isOnline() && (
                  <button
                    type="button"
                    onClick={async () => {
                      setUseManualAddress(false);
                      setLoadingAddress(true);
                      setAddressError(null);
                      try {
                        const currentAddress = await getCurrentAddress();
                        setAddress(currentAddress);
                        setFormData(prev => ({
                          ...prev,
                          shippingAddress: currentAddress.formatted
                        }));
                      } catch (error) {
                        setAddressError(error.message);
                        setUseManualAddress(true);
                      } finally {
                        setLoadingAddress(false);
                      }
                    }}
                    style={{
                      fontSize: '0.875rem',
                      color: '#667eea',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    Use Auto-Detect
                  </button>
                )}
              </div>
              
              {useManualAddress ? (
                // Manual address input fields
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {!isOnline() && (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#e3f2fd',
                      border: '1px solid #2196f3',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#1976d2'
                    }}>
                      📡 Offline Mode: Please enter your shipping address manually
                    </div>
                  )}
                  
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      color: '#666',
                      fontSize: '0.9rem'
                    }}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="123 Main Street"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        border: errors.street ? '2px solid #f44336' : '2px solid #e0e0e0',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        if (!errors.street) {
                          e.currentTarget.style.borderColor = '#667eea';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.street) {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                        }
                      }}
                    />
                    {errors.street && (
                      <span style={{
                        color: '#f44336',
                        fontSize: '0.875rem',
                        marginTop: '0.25rem',
                        display: 'block'
                      }}>
                        {errors.street}
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="New York"
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: errors.city ? '2px solid #f44336' : '2px solid #e0e0e0',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          transition: 'border-color 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          if (!errors.city) {
                            e.currentTarget.style.borderColor = '#667eea';
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.city) {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                          }
                        }}
                      />
                      {errors.city && (
                        <span style={{
                          color: '#f44336',
                          fontSize: '0.875rem',
                          marginTop: '0.25rem',
                          display: 'block'
                        }}>
                          {errors.city}
                        </span>
                      )}
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="10001"
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          transition: 'border-color 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="NY"
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: '2px solid #e0e0e0',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          transition: 'border-color 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: '500',
                        color: '#666',
                        fontSize: '0.9rem'
                      }}>
                        Country *
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="United States"
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: errors.country ? '2px solid #f44336' : '2px solid #e0e0e0',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          transition: 'border-color 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          if (!errors.country) {
                            e.currentTarget.style.borderColor = '#667eea';
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.country) {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                          }
                        }}
                      />
                      {errors.country && (
                        <span style={{
                          color: '#f44336',
                          fontSize: '0.875rem',
                          marginTop: '0.25rem',
                          display: 'block'
                        }}>
                          {errors.country}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : loadingAddress ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '10px',
                  border: '2px dashed #e0e0e0'
                }}>
                  <p style={{ margin: 0, color: '#666' }}>
                    Requesting location access...
                  </p>
                </div>
              ) : addressError ? (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '10px',
                  color: '#856404'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                    ⚠️ Location Access Required
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    {addressError}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '1rem'
                  }}>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoadingAddress(true);
                        setAddressError(null);
                        try {
                          const currentAddress = await getCurrentAddress();
                          setAddress(currentAddress);
                          setFormData(prev => ({
                            ...prev,
                            shippingAddress: currentAddress.formatted
                          }));
                        } catch (error) {
                          setAddressError(error.message);
                        } finally {
                          setLoadingAddress(false);
                        }
                      }}
                      style={{
                        padding: '0.625rem 1.25rem',
                        backgroundColor: '#ffc107',
                        color: '#856404',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseManualAddress(true);
                        setAddressError(null);
                      }}
                      style={{
                        padding: '0.625rem 1.25rem',
                        backgroundColor: '#f5f5f5',
                        color: '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>
              ) : address ? (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    color: '#333'
                  }}>
                    {address.street && (
                      <>
                        <strong style={{ color: '#666' }}>Street:</strong>
                        <span>{address.street}</span>
                      </>
                    )}
                    {address.city && (
                      <>
                        <strong style={{ color: '#666' }}>City:</strong>
                        <span>{address.city}</span>
                      </>
                    )}
                    {address.state && (
                      <>
                        <strong style={{ color: '#666' }}>State:</strong>
                        <span>{address.state}</span>
                      </>
                    )}
                    {address.postalCode && (
                      <>
                        <strong style={{ color: '#666' }}>Postal Code:</strong>
                        <span>{address.postalCode}</span>
                      </>
                    )}
                    {address.country && (
                      <>
                        <strong style={{ color: '#666' }}>Country:</strong>
                        <span>{address.country}</span>
                      </>
                    )}
                  </div>
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e0e0e0',
                    fontSize: '0.9rem',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    📍 {formData.shippingAddress}
                  </div>
                </div>
              ) : null}
              
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
              disabled={submitting || (loadingAddress && !useManualAddress) || (!useManualAddress && !address)}
              style={{
                width: '100%',
                padding: '1.125rem',
                backgroundColor: (submitting || (loadingAddress && !useManualAddress) || (!useManualAddress && !address)) ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: (submitting || (loadingAddress && !useManualAddress) || (!useManualAddress && !address)) ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: (submitting || (loadingAddress && !useManualAddress) || (!useManualAddress && !address)) ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!submitting && !(loadingAddress && !useManualAddress) && (useManualAddress || address)) {
                  e.currentTarget.style.backgroundColor = '#5568d3';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting && !(loadingAddress && !useManualAddress) && (useManualAddress || address)) {
                  e.currentTarget.style.backgroundColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loadingAddress && !useManualAddress ? 'Detecting Location...' : submitting ? 'Processing Order...' : 'Place Order'}
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
    </>
  );
};
