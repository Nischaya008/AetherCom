import { useState, useEffect, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../utils/api.js';
import { useCart } from '../contexts/CartContext.jsx';
import { saveProducts, getProducts, saveCategories, getCategories } from '../utils/db.js';
import { isOnline } from '../utils/queue.js';

const ProductCard = lazy(() => import('./ProductCard.jsx').then(m => ({ default: m.ProductCard })));

export const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
  }, [page, search, selectedCategory]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadCategories();
    
    // Reload data when coming back online
    const handleOnlineSync = () => {
      loadProducts();
      loadCategories();
    };
    
    window.addEventListener('online-sync-complete', handleOnlineSync);
    
    return () => {
      window.removeEventListener('online-sync-complete', handleOnlineSync);
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Always try to load from cache first (for faster initial load)
      const cachedProducts = await getProducts().catch(() => []);
      
      // If offline, use cache only
      if (!isOnline()) {
        if (cachedProducts.length > 0) {
          // Filter cached products based on search and category
          let filtered = cachedProducts;
          if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(p => 
              p.name?.toLowerCase().includes(searchLower) ||
              p.description?.toLowerCase().includes(searchLower)
            );
          }
          if (selectedCategory) {
            filtered = filtered.filter(p => String(p.categoryId?._id || p.categoryId) === selectedCategory);
          }
          setProducts(filtered);
          setTotalPages(Math.ceil(filtered.length / 20));
          setLoading(false);
          return;
        } else {
          // No cache available offline
          setProducts([]);
          setTotalPages(0);
          setLoading(false);
          return;
        }
      }

      // Online - try to fetch from API, fallback to cache
      try {
        const data = await fetchProducts({
          page,
          limit: 20,
          search,
          category: selectedCategory
        });
        setProducts(data.products);
        setTotalPages(data.pagination.pages);
        
        // Save to IndexedDB for offline access
        if (data.products && data.products.length > 0) {
          await saveProducts(data.products).catch(console.error);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to cached products
        if (cachedProducts.length > 0) {
          let filtered = cachedProducts;
          if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(p => 
              p.name?.toLowerCase().includes(searchLower) ||
              p.description?.toLowerCase().includes(searchLower)
            );
          }
          if (selectedCategory) {
            filtered = filtered.filter(p => String(p.categoryId?._id || p.categoryId) === selectedCategory);
          }
          setProducts(filtered);
          setTotalPages(Math.ceil(filtered.length / 20));
        } else {
          setProducts([]);
          setTotalPages(0);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Always try to load from cache first
      const cachedCategories = await getCategories().catch(() => []);
      
      // If offline, use cache only
      if (!isOnline()) {
        if (cachedCategories.length > 0) {
          setCategories(cachedCategories);
          return;
        } else {
          setCategories([]);
          return;
        }
      }

      // Online - try to fetch from API, fallback to cache
      try {
        const data = await fetchCategories();
        setCategories(data);
        
        // Save to IndexedDB for offline access
        if (data && data.length > 0) {
          await saveCategories(data).catch(console.error);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to cached categories
        if (cachedCategories.length > 0) {
          setCategories(cachedCategories);
        } else {
          setCategories([]);
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Try cache as last resort
      try {
        const cachedCategories = await getCategories();
        if (cachedCategories.length > 0) {
          setCategories(cachedCategories);
        }
      } catch (e) {
        console.error('Error loading cached categories:', e);
      }
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? '' : categoryId);
    setPage(1);
    setSearchInput('');
    setSearch('');
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = selectedCategory || search;

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#fafafa'
    }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '700',
            marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}>
            E-commerce that refuses to go offline
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            marginBottom: '2.5rem',
            opacity: 0.95,
            maxWidth: '600px',
            margin: '0 auto 2.5rem'
          }}>
            Shopping that survives the network
          </p>

          {/* Search Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
              setPage(1);
            }}
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              backgroundColor: 'white',
              borderRadius: '50px',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              transition: 'box-shadow 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)';
            }}
            >
              <input
                type="text"
                placeholder="Search for products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '1rem 1.5rem',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  color: '#333'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          zIndex: 1
        }} />
      </section>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Categories Section */}
        {categories.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: '600',
                color: '#1a1a1a'
              }}>
                Shop by Category
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#666',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8e8e8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'thin',
              scrollbarColor: '#ccc transparent'
            }}>
              <button
                onClick={() => handleCategoryClick('')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: selectedCategory === '' ? '#667eea' : 'white',
                  color: selectedCategory === '' ? 'white' : '#333',
                  border: `2px solid ${selectedCategory === '' ? '#667eea' : '#e0e0e0'}`,
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  boxShadow: selectedCategory === '' ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
                }}
              >
                All Products
              </button>
              {categories.map(cat => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryClick(cat._id)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: selectedCategory === cat._id ? '#667eea' : 'white',
                    color: selectedCategory === cat._id ? 'white' : '#333',
                    border: `2px solid ${selectedCategory === cat._id ? '#667eea' : '#e0e0e0'}`,
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    boxShadow: selectedCategory === cat._id ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Products Section */}
        <section>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '0.25rem'
              }}>
                {hasActiveFilters ? (search ? `Search results for "${search}"` : 'Filtered Products') : 'Featured Products'}
              </h2>
              {!loading && (
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  {products.length} {products.length === 1 ? 'product' : 'products'} found
                </p>
              )}
            </div>
          </div>

          {/* Products Grid */}
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
              <p style={{ marginTop: '1rem', color: '#666' }}>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#333' }}>
                No products found
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                {hasActiveFilters 
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for new products'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
              }}>
                <Suspense fallback={
                  <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
                }>
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} onAddToCart={addToCart} />
                  ))}
                </Suspense>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  padding: '2rem 0'
                }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: page === 1 ? '#f5f5f5' : 'white',
                      color: page === 1 ? '#999' : '#333',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s',
                      boxShadow: page === 1 ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      if (page !== 1) {
                        e.currentTarget.style.backgroundColor = '#f9f9f9';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== 1) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: page === pageNum ? '#667eea' : 'white',
                            color: page === pageNum ? 'white' : '#333',
                            border: `1px solid ${page === pageNum ? '#667eea' : '#e0e0e0'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: page === pageNum ? '600' : '400',
                            fontSize: '0.95rem',
                            minWidth: '40px',
                            transition: 'all 0.2s',
                            boxShadow: page === pageNum ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (page !== pageNum) {
                              e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (page !== pageNum) {
                              e.currentTarget.style.backgroundColor = 'white';
                            }
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && page < totalPages - 2 && (
                      <>
                        <span style={{ color: '#999', padding: '0 0.5rem' }}>...</span>
                        <button
                          onClick={() => setPage(totalPages)}
                          style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'white',
                            color: '#333',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '400',
                            fontSize: '0.95rem',
                            minWidth: '40px'
                          }}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: page === totalPages ? '#f5f5f5' : 'white',
                      color: page === totalPages ? '#999' : '#333',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s',
                      boxShadow: page === totalPages ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      if (page !== totalPages) {
                        e.currentTarget.style.backgroundColor = '#f9f9f9';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== totalPages) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    Next →
                  </button>
                  
                  <span style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    marginLeft: '1rem'
                  }}>
                    Page {page} of {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
