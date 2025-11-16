import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProduct } from '../utils/api.js';
import { useCart } from '../contexts/CartContext.jsx';
import { getProduct, saveProducts } from '../utils/db.js';
import { isOnline } from '../utils/queue.js';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { cart, addToCart, updateCartItem } = useCart();
  const productId = product ? String(product._id || product.id) : null;
  const cartItem = productId ? cart.find(item => String(item.productId) === productId) : null;
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const isInCart = cartQuantity > 0;
  const canAddMore = !isInCart || quantity !== cartQuantity;

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    // Sync quantity with cart quantity when product loads
    if (product && cartItem) {
      setQuantity(cartItem.quantity);
    } else if (product) {
      setQuantity(1);
    }
  }, [product, cartItem]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      
      // Try to load from cache/IndexedDB first for offline support
      if (!isOnline()) {
        const cachedProduct = await getProduct(id);
        if (cachedProduct) {
          setProduct(cachedProduct);
          setLoading(false);
          return;
        }
      }

      // Try to fetch from API
      try {
        const data = await fetchProduct(id);
        setProduct(data);
        
        // Save to IndexedDB for offline access
        if (data) {
          await saveProducts([data]);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        // Fallback to cached product
        const cachedProduct = await getProduct(id);
        if (cachedProduct) {
          setProduct(cachedProduct);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      if (isInCart) {
        // Update existing cart item quantity
        await updateCartItem(productId, quantity);
      } else {
        // Add new items to cart
        for (let i = 0; i < quantity; i++) {
          await addToCart(product);
        }
      }
      setIsAdding(false);
    } catch (error) {
      console.error('Error updating cart:', error);
      setIsAdding(false);
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
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#333' }}>
          Product not found
        </h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            backgroundColor: '#667eea',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            transition: 'all 0.2s'
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
          ← Back to Products
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
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '2rem' }}>
        <Link
          to="/"
          style={{
            color: '#667eea',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#5568d3'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
        >
          <span>←</span> Back to Products
        </Link>
      </nav>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '3rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        {/* Product Image */}
        <div
          style={{
            width: '100%',
            position: 'relative',
            aspectRatio: '1 / 1',
            overflow: 'hidden',
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
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
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.backgroundColor = '#e0e0e0';
              e.target.parentElement.innerHTML = '<div style="padding: 2rem; text-align: center; color: #999; font-size: 1.1rem;">Image unavailable</div>';
            }}
          />
        </div>

        {/* Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#1a1a1a',
              lineHeight: '1.2',
              letterSpacing: '-0.02em'
            }}>
              {product.name}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <span style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: '700',
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
                ${product.price.toFixed(2)}
              </span>
              {product.stock > 0 ? (
                <span style={{
                  fontSize: '0.875rem',
                  color: '#4caf50',
                  backgroundColor: '#e8f5e9',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '20px',
                  fontWeight: '500'
                }}>
                  ✓ In Stock ({product.stock} available)
                </span>
              ) : (
                <span style={{
                  fontSize: '0.875rem',
                  color: '#f44336',
                  backgroundColor: '#ffebee',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '20px',
                  fontWeight: '500'
                }}>
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <div style={{
              marginBottom: '2rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#333'
              }}>
                Description
              </h3>
              <p style={{
                color: '#666',
                lineHeight: '1.7',
                fontSize: '1rem'
              }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.75rem',
              fontWeight: '600',
              color: '#333',
              fontSize: '1rem'
            }}>
              Quantity
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                overflow: 'hidden',
                width: 'fit-content'
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    backgroundColor: '#f5f5f5',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: quantity <= 1 ? '#ccc' : '#333',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (quantity > 1) {
                      e.currentTarget.style.backgroundColor = '#eeeeee';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (quantity > 1) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1));
                    setQuantity(val);
                  }}
                  style={{
                    width: '80px',
                    padding: '0.75rem',
                    border: 'none',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    backgroundColor: '#f5f5f5',
                    cursor: quantity >= product.stock ? 'not-allowed' : 'pointer',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: quantity >= product.stock ? '#ccc' : '#333',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (quantity < product.stock) {
                      e.currentTarget.style.backgroundColor = '#eeeeee';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (quantity < product.stock) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                >
                  +
                </button>
              </div>
              {isInCart && (
                <span style={{
                  fontSize: '0.875rem',
                  color: '#667eea',
                  fontWeight: '500'
                }}>
                  ({cartQuantity} in cart)
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || quantity > product.stock || isAdding || (!canAddMore && isInCart)}
            style={{
              width: '100%',
              padding: '1.125rem',
              backgroundColor: isInCart && canAddMore ? '#667eea' : (isInCart ? '#66bb6a' : (isAdding ? '#66bb6a' : (product.stock > 0 ? '#667eea' : '#ccc'))),
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: (product.stock > 0 && quantity <= product.stock && !isAdding && (canAddMore || !isInCart)) ? 'pointer' : 'not-allowed',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isAdding ? 'scale(0.98)' : 'scale(1)',
              boxShadow: (product.stock > 0 && quantity <= product.stock && !isAdding && (canAddMore || !isInCart)) ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (product.stock > 0 && quantity <= product.stock && !isAdding && (canAddMore || !isInCart)) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (product.stock > 0 && quantity <= product.stock && !isAdding && (canAddMore || !isInCart)) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {isAdding ? 'Updating...' : (isInCart && canAddMore ? `Update Cart (${quantity})` : (isInCart ? '✓ Added to Cart' : 'Add to Cart'))}
          </button>

          {isInCart && (
            <Link
              to="/cart"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.875rem',
                backgroundColor: '#f5f5f5',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '10px',
                fontWeight: '500',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
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
              View Cart →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
