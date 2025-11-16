import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';

export const ProductCard = ({ product, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);
  const { cart } = useCart();
  const productId = String(product._id || product.id);
  const isInCart = cart.some(item => String(item.productId) === productId);

  const handleAddToCart = async () => {
    if (isAdding || isInCart) return; // Prevent multiple clicks or re-adding
    setIsAdding(true);
    try {
      await onAddToCart(product);
      // Keep "Added to Cart" state - don't revert
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAdding(false);
    }
  };

  return (
    <div
      style={{
        border: 'none',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <Link
        to={`/product/${product._id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div
          style={{
            width: '100%',
            height: '240px',
            overflow: 'hidden',
            backgroundColor: '#f8f9fa',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={product.imageURL}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              minWidth: '100%',
              minHeight: '100%'
            }}
            loading="lazy"
            onError={(e) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
              e.target.parentElement.style.backgroundColor = '#e0e0e0';
              e.target.parentElement.innerHTML = '<div style="padding: 2rem; text-align: center; color: #999;">Image unavailable</div>';
            }}
          />
        </div>
        <div style={{ 
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1
        }}>
          <h3 style={{ 
            margin: '0 0 0.75rem 0', 
            fontSize: '1.15rem',
            fontWeight: '600',
            color: '#1a1a1a',
            lineHeight: '1.3'
          }}>
            {product.name}
          </h3>
          <p
            style={{
              margin: '0 0 1rem 0',
              color: '#666',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              flex: 1
            }}
          >
            {product.description || 'Premium quality product'}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: 'auto',
              paddingTop: '1rem',
              borderTop: '1px solid #f0f0f0'
            }}
          >
            <div>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
                ${product.price.toFixed(2)}
              </span>
            </div>
            {product.stock > 0 ? (
              <span style={{ 
                fontSize: '0.75rem',
                color: '#4caf50',
                backgroundColor: '#e8f5e9',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                ✓ In Stock
              </span>
            ) : (
              <span style={{ 
                fontSize: '0.75rem',
                color: '#f44336',
                backgroundColor: '#ffebee',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </Link>
      <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddToCart();
          }}
          disabled={product.stock === 0 || isInCart}
          style={{
            width: '100%',
            padding: '0.875rem',
            backgroundColor: isInCart ? '#66bb6a' : (isAdding ? '#66bb6a' : (product.stock > 0 ? '#667eea' : '#e0e0e0')),
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: product.stock > 0 && !isAdding && !isInCart ? 'pointer' : 'not-allowed',
            fontSize: '0.95rem',
            fontWeight: '600',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isAdding ? 'scale(0.98)' : 'scale(1)',
            boxShadow: product.stock > 0 && !isInCart ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (product.stock > 0 && !isAdding && !isInCart) {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (product.stock > 0 && !isAdding && !isInCart) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
            }
          }}
        >
          {isInCart ? '✓ Added to Cart' : (isAdding ? 'Adding...' : (product.stock > 0 ? 'Add to Cart' : 'Out of Stock'))}
        </button>
      </div>
    </div>
  );
};

