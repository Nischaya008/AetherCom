import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchOrders } from '../utils/api.js';
import { getOrders, saveOrder } from '../utils/db.js';
import { isOnline } from '../utils/queue.js';

export const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    // Try to get email from localStorage (from checkout)
    const savedEmail = localStorage.getItem('orderEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setSearchEmail(savedEmail);
      loadOrders(savedEmail);
    } else {
      setLoading(false);
    }
    
    // Reload orders when coming back online
    const handleOnlineSync = () => {
      if (email || savedEmail) {
        loadOrders(email || savedEmail);
      }
    };
    
    window.addEventListener('online-sync-complete', handleOnlineSync);
    
    return () => {
      window.removeEventListener('online-sync-complete', handleOnlineSync);
    };
  }, [email]);

  const loadOrders = async (emailToSearch) => {
    if (!emailToSearch) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let ordersData = [];

      // Get orders from IndexedDB first
      const localOrders = await getOrders();
      ordersData = localOrders.filter(order => 
        order.email?.toLowerCase() === emailToSearch.toLowerCase()
      );

      // If online, try to fetch from server and merge
      if (isOnline()) {
        try {
          const serverOrders = await fetchOrders(emailToSearch);
          
          // Merge and deduplicate orders
          const orderMap = new Map();
          
          // Add local orders first
          ordersData.forEach(order => {
            orderMap.set(order._id, order);
          });
          
          // Add/update with server orders
          serverOrders.forEach(order => {
            orderMap.set(order._id, order);
            // Save to IndexedDB for offline access
            saveOrder(order).catch(console.error);
          });
          
          ordersData = Array.from(orderMap.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (error) {
          console.error('Error fetching orders from server:', error);
          // Continue with local orders
        }
      }

      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchEmail) {
      localStorage.setItem('orderEmail', searchEmail);
      setEmail(searchEmail);
      loadOrders(searchEmail);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#e8f5e9', color: '#4caf50' };
      case 'processing':
        return { bg: '#e3f2fd', color: '#2196f3' };
      case 'cancelled':
        return { bg: '#ffebee', color: '#f44336' };
      default:
        return { bg: '#fff3cd', color: '#856404' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      <h1 style={{
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        fontWeight: '700',
        marginBottom: '2rem',
        color: '#1a1a1a',
        letterSpacing: '-0.02em'
      }}>
        My Orders
      </h1>

      {/* Email Search */}
      {!email && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            marginTop: 0,
            marginBottom: '1rem',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#333'
          }}>
            Find Your Orders
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '1.5rem',
            fontSize: '0.95rem'
          }}>
            Enter the email address you used when placing your order
          </p>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              style={{
                flex: 1,
                minWidth: '250px',
                padding: '0.875rem',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
            />
            <button
              type="submit"
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
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
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
              Search Orders
            </button>
          </form>
        </div>
      )}

      {email && (
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>
            Showing orders for: <strong>{email}</strong>
          </p>
          <button
            onClick={() => {
              setEmail('');
              setSearchEmail('');
              setOrders([]);
              localStorage.removeItem('orderEmail');
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}
          >
            Change Email
          </button>
        </div>
      )}

      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem'
        }}>
          <div style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading orders...</p>
        </div>
      ) : orders.length === 0 && email ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            color: '#333'
          }}>
            No orders found
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            We couldn't find any orders for this email address.
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              backgroundColor: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: '600'
            }}
          >
            Start Shopping
          </Link>
        </div>
      ) : orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => {
            const statusStyle = getStatusColor(order.status);
            return (
              <div
                key={order._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '2rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1a1a1a'
                    }}>
                      Order #{order._id?.slice(-8) || 'N/A'}
                    </h3>
                    <p style={{
                      margin: 0,
                      color: '#666',
                      fontSize: '0.9rem'
                    }}>
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.375rem 0.875rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      marginBottom: '0.5rem'
                    }}>
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#1a1a1a'
                    }}>
                      ${order.totalPrice?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                <div style={{
                  marginBottom: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <h4 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    Items ({order.lineItems?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {order.lineItems?.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'center'
                        }}
                      >
                        {item.imageURL && (
                          <img
                            src={item.imageURL}
                            alt={item.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              backgroundColor: '#f5f5f5'
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{
                            margin: 0,
                            fontWeight: '500',
                            color: '#333',
                            fontSize: '0.95rem'
                          }}>
                            {item.name || 'Unknown Product'}
                          </p>
                          <p style={{
                            margin: '0.25rem 0 0 0',
                            color: '#666',
                            fontSize: '0.875rem'
                          }}>
                            Qty: {item.quantity} × ${item.price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <span style={{
                          fontWeight: '600',
                          color: '#1a1a1a'
                        }}>
                          ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.shippingAddress && (
                  <div style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid #f0f0f0',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    <strong>Shipping to:</strong> {order.shippingAddress}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

