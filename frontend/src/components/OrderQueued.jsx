import { Link } from 'react-router-dom';

export const OrderQueued = () => {
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
          backgroundColor: '#fff3cd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem'
        }}>
          ⏳
        </div>
        
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: '700',
          marginBottom: '1rem',
          color: '#1a1a1a',
          letterSpacing: '-0.02em'
        }}>
          Order Queued
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          marginBottom: '1rem',
          color: '#666',
          lineHeight: '1.6'
        }}>
          Your order has been saved locally and will be processed automatically when you're back online.
        </p>
        
        <p style={{
          fontSize: '1rem',
          marginBottom: '2rem',
          color: '#666'
        }}>
          You'll receive a confirmation email once the order is successfully placed.
        </p>
        
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          textAlign: 'left'
        }}>
          <h3 style={{
            marginTop: 0,
            marginBottom: '0.75rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#333'
          }}>
            What happens next?
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '1.5rem',
            color: '#666',
            lineHeight: '1.8'
          }}>
            <li>Your order is safely stored on your device</li>
            <li>It will automatically sync when you reconnect to the internet</li>
            <li>You'll receive an email confirmation once processed</li>
            <li>Check your orders page to see the status</li>
          </ul>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginTop: '2.5rem',
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
