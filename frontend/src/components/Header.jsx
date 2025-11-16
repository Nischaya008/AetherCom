import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { OfflineBanner } from './OfflineBanner.jsx';

export const Header = () => {
  const { getCartItemCount } = useCart();

  return (
    <>
      <OfflineBanner />
      <header
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '1.25rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease'
        }}
      >
        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1400px',
            margin: '0 auto'
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <img 
              src="/icons/Logo_256.png" 
              alt="PWA Store Logo" 
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <span
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '1.75rem',
                fontWeight: '700',
                letterSpacing: '-0.02em'
              }}
            >
              PWA Store
            </span>
          </Link>
          <div style={{ 
            display: 'flex', 
            gap: '2rem', 
            alignItems: 'center' 
          }}>
            <Link
              to="/"
              style={{ 
                textDecoration: 'none', 
                color: '#333',
                fontWeight: '500',
                fontSize: '1rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              Shop
            </Link>
            <Link
              to="/orders"
              style={{ 
                textDecoration: 'none', 
                color: '#333',
                fontWeight: '500',
                fontSize: '1rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#333'}
            >
              Orders
            </Link>
            <Link
              to="/cart"
              style={{
                textDecoration: 'none',
                color: '#333',
                position: 'relative',
                padding: '0.625rem 1.25rem',
                borderRadius: '25px',
                backgroundColor: '#f5f5f5',
                fontWeight: '500',
                fontSize: '1rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eeeeee';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Cart</span>
              {getCartItemCount() > 0 && (
                <span
                  style={{
                    backgroundColor: '#667eea',
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0 0.5rem'
                  }}
                >
                  {getCartItemCount()}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
};

