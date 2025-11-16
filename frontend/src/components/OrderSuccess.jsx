import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchOrder } from '../utils/api.js';
import { getOrder, saveOrder } from '../utils/db.js';
import { isOnline } from '../utils/queue.js';

export const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      // Try to load from IndexedDB first
      let orderData = await getOrder(id);
      
      // If not in IndexedDB and online, fetch from server
      if (!orderData && isOnline()) {
        try {
          orderData = await fetchOrder(id);
          // Save to IndexedDB for offline access
          if (orderData) {
            await saveOrder(orderData);
          }
        } catch (error) {
          console.error('Error fetching order:', error);
        }
      }
      
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '4rem 2rem',
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
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
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading order...</p>
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
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '4rem 3rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 2rem',
          borderRadius: '50%',
          backgroundColor: '#e8f5e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem'
        }}>
          ✓
        </div>
        
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: '700',
          marginBottom: '1rem',
          color: '#1a1a1a',
          letterSpacing: '-0.02em'
        }}>
          Order Placed Successfully!
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          marginBottom: '0.5rem',
          color: '#666'
        }}>
          Your order <strong style={{ color: '#667eea' }}>#{id?.slice(-8)}</strong> has been confirmed
        </p>
        
        {order && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <span style={{ color: '#666' }}>Total Amount:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a' }}>
                ${order.totalPrice?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#666' }}>Status: </span>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '500',
                backgroundColor: order.status === 'completed' ? '#e8f5e9' : '#fff3cd',
                color: order.status === 'completed' ? '#4caf50' : '#856404'
              }}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
              </span>
            </div>
            {order.email && (
              <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.95rem' }}>
                Confirmation email sent to: <strong>{order.email}</strong>
              </div>
            )}
          </div>
        )}
        
        <p style={{
          fontSize: '1rem',
          marginTop: '2rem',
          marginBottom: '2rem',
          color: '#666'
        }}>
          We'll send you an email confirmation with order details and tracking information.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            to="/orders"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              backgroundColor: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
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
            View My Orders
          </Link>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              backgroundColor: '#f5f5f5',
              color: '#333',
              textDecoration: 'none',
              borderRadius: '12px',
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
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
