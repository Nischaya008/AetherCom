import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { validateCart } from '../utils/api.js';
import { isOnline } from '../utils/queue.js';

export const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, getCartTotal, reloadCart } = useCart();
  const [reconciliation, setReconciliation] = useState(null);

  useEffect(() => {
    if (isOnline() && cart.length > 0 && !reconciliation) {
      validateCartOnMount();
    }
  }, [cart.length]);

  const validateCartOnMount = async () => {
    if (!isOnline() || cart.length === 0) return;
    
    try {
      const validation = await validateCart(
        cart.map(item => ({
          productId: String(item.productId),
          quantity: item.quantity,
          price: item.price
        }))
      );

      if (validation.hasChanges && (
        validation.adjustedItems?.length > 0 || 
        validation.removedItems?.length > 0
      )) {
        const hasStockIssues = validation.adjustedItems?.some(
          item => item.adjustedQuantity !== item.requestedQuantity
        ) || validation.removedItems?.length > 0;
        
        const hasPriceChanges = validation.adjustedItems?.some(
          item => Math.abs((item.oldPrice || 0) - (item.newPrice || 0)) > 0.01
        );
        
        if (hasStockIssues || hasPriceChanges) {
          setReconciliation(validation);
        }
      }
    } catch (error) {
      console.error('Cart validation error:', error);
    }
  };

  const handleReconciliation = async () => {
    if (!reconciliation) return;

    const reconciledCart = cart
      .map(item => {
        const adjusted = reconciliation.adjustedItems.find(
          adj => adj.productId === item.productId
        );
        if (adjusted) {
          return {
            ...item,
            quantity: adjusted.adjustedQuantity,
            price: adjusted.newPrice
          };
        }
        return item;
      })
      .filter(item => {
        return !reconciliation.removedItems.some(
          removed => removed.productId === item.productId
        );
      });

    await Promise.all(
      reconciledCart.map(item => updateCartItem(item.productId, item.quantity))
    );

    reconciliation.removedItems.forEach(removed => {
      removeFromCart(removed.productId);
    });

    setReconciliation(null);
    reloadCart();
  };

  if (cart.length === 0) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '4rem 2rem',
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🛒</div>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: '700',
          marginBottom: '1rem',
          color: '#1a1a1a'
        }}>
          Your Cart is Empty
        </h1>
        <p style={{
          color: '#666',
          marginBottom: '2.5rem',
          fontSize: '1.1rem',
          maxWidth: '500px'
        }}>
          Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '1rem 2.5rem',
            backgroundColor: '#667eea',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '1.05rem',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5568d3';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#667eea';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
        >
          Continue Shopping
        </Link>
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
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: '700',
          marginBottom: '0.5rem',
          color: '#1a1a1a',
          letterSpacing: '-0.02em'
        }}>
          Shopping Cart
        </h1>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {reconciliation && (
        <div
          style={{
            backgroundColor: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <h3 style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#856404'
          }}>
            Cart Needs Update
          </h3>
          {reconciliation.adjustedItems.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#856404' }}>
                Some items have changed:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404' }}>
                {reconciliation.adjustedItems.map(item => (
                  <li key={item.productId} style={{ marginBottom: '0.25rem' }}>
                    <strong>{item.name}</strong>: Quantity adjusted to {item.adjustedQuantity || item.requestedQuantity || item.quantity}
                    {item.oldPrice && item.newPrice && (
                      <> - Price changed from ${typeof item.oldPrice === 'number' ? item.oldPrice.toFixed(2) : item.oldPrice} to ${typeof item.newPrice === 'number' ? item.newPrice.toFixed(2) : item.newPrice}</>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {reconciliation.removedItems.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#856404' }}>
                Some items are no longer available:
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404' }}>
                {reconciliation.removedItems.map(item => (
                  <li key={item.productId} style={{ marginBottom: '0.25rem' }}>
                    <strong>{item.name || item.productId}</strong>: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(133, 100, 4, 0.2)'
          }}>
            <p style={{ margin: 0, fontWeight: '600', color: '#856404', fontSize: '1.1rem' }}>
              New Total: <strong>${reconciliation.newTotalPrice ? (typeof reconciliation.newTotalPrice === 'number' ? reconciliation.newTotalPrice.toFixed(2) : reconciliation.newTotalPrice) : '0.00'}</strong>
            </p>
            <button
              onClick={handleReconciliation}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#45a049';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4caf50';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Update Cart
            </button>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem'
      }}>
        {/* Cart Items */}
        <div>
          {cart.map(item => (
            <div
              key={item.productId}
              style={{
                display: 'flex',
                gap: '1.5rem',
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Link
                to={`/product/${item.productId}`}
                style={{ textDecoration: 'none', flexShrink: 0 }}
              >
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    overflow: 'hidden',
                    borderRadius: '10px',
                    backgroundColor: '#f8f9fa',
                    position: 'relative'
                  }}
                >
                  <img
                    src={item.imageURL}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      minWidth: '100%',
                      minHeight: '100%'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.backgroundColor = '#e0e0e0';
                    }}
                  />
                </div>
              </Link>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <Link
                    to={`/product/${item.productId}`}
                    style={{
                      textDecoration: 'none',
                      color: '#1a1a1a'
                    }}
                  >
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.15rem',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>
                      {item.name || 'Unknown Product'}
                    </h3>
                  </Link>
                  <p style={{
                    margin: '0 0 1rem 0',
                    color: '#666',
                    fontSize: '0.95rem'
                  }}>
                    ${item.price ? (typeof item.price === 'number' ? item.price.toFixed(2) : item.price) : '0.00'} each
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: 'fit-content'
                  }}>
                    <button
                      onClick={() => updateCartItem(item.productId, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        backgroundColor: '#f5f5f5',
                        cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: item.quantity <= 1 ? '#ccc' : '#333',
                        transition: 'all 0.2s'
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateCartItem(item.productId, Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '60px',
                        padding: '0.5rem',
                        border: 'none',
                        textAlign: 'center',
                        fontSize: '1rem',
                        fontWeight: '600',
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: 'none',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#333',
                        transition: 'all 0.2s'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ffebee',
                      color: '#f44336',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffcdd2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffebee';
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div style={{
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  margin: 0,
                  color: '#1a1a1a',
                  letterSpacing: '-0.02em'
                }}>
                  ${(item.price && item.quantity) ? ((typeof item.price === 'number' ? item.price : parseFloat(item.price)) * (typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity))).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <div
            style={{
              padding: '2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1rem',
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
            <button
              onClick={() => navigate('/checkout')}
              style={{
                width: '100%',
                padding: '1.125rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5568d3';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              Proceed to Checkout
            </button>
            <Link
              to="/"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '1rem',
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.95rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#5568d3'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
