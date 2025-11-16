import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext.jsx';
import { ConnectivityProvider } from './contexts/ConnectivityContext.jsx';
import { Header } from './components/Header.jsx';
import './App.css';

// Lazy load routes for code-splitting
const ProductList = lazy(() => import('./components/ProductList.jsx').then(m => ({ default: m.ProductList })));
const ProductDetail = lazy(() => import('./components/ProductDetail.jsx').then(m => ({ default: m.ProductDetail })));
const Cart = lazy(() => import('./components/Cart.jsx').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('./components/Checkout.jsx').then(m => ({ default: m.Checkout })));
const OrderSuccess = lazy(() => import('./components/OrderSuccess.jsx').then(m => ({ default: m.OrderSuccess })));
const OrderQueued = lazy(() => import('./components/OrderQueued.jsx').then(m => ({ default: m.OrderQueued })));
const Orders = lazy(() => import('./components/Orders.jsx').then(m => ({ default: m.Orders })));

const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '400px',
    fontSize: '1.2rem'
  }}>
    Loading...
  </div>
);

function App() {
  return (
    <ConnectivityProvider>
      <CartProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="App">
            <Header />
            <main style={{ minHeight: 'calc(100vh - 200px)' }}>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<ProductList />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success/:id" element={<OrderSuccess />} />
                  <Route path="/order-queued" element={<OrderQueued />} />
                  <Route path="/orders" element={<Orders />} />
                </Routes>
              </Suspense>
            </main>
            <footer
              style={{
                backgroundColor: '#f5f5f5',
                borderTop: '1px solid #e0e0e0',
                padding: '2rem',
                marginTop: '4rem',
                textAlign: 'center',
                color: '#666'
              }}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '1rem',
                maxWidth: '1400px',
                margin: '0 auto'
              }}>
                <img 
                  src="/icons/Logo_256.png" 
                  alt="PWA Store Logo" 
                  style={{
                    height: '48px',
                    width: 'auto',
                    objectFit: 'contain',
                    opacity: 0.7
                  }}
                />
                <p>&copy; 2025 PWA Store. Offline e-commerce platform.</p>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </CartProvider>
    </ConnectivityProvider>
  );
}

export default App;
