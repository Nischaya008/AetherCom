# PWA Store

![PWA Store Banner](https://github.com/Nischaya008/Image_hosting/blob/main/Screenshot%202025-11-16%20191009.png?raw=true)

🛒 **PWA Store** is a full-stack, offline-first Progressive Web Application (PWA) e-commerce platform built with modern web technologies. The application enables users to browse products, manage shopping carts, and place orders even when offline, with automatic synchronization when connectivity is restored.

## 🌟 Features

### 🔥 Offline-First Architecture

- **Complete offline functionality** - Browse, cart, and checkout without internet
- **Automatic synchronization** - Seamless sync when connectivity is restored
- **Persistent data storage** - IndexedDB for cart, orders, and product catalog
- **Service worker caching** - Intelligent caching strategies for optimal performance

### 🛠️ Progressive Web App (PWA)

- **Installable** - Add to home screen on mobile and desktop
- **App-like experience** - Standalone mode with native feel
- **Service worker** - Background sync and offline support
- **Responsive design** - Mobile-first, adaptive layouts

### ⚡ Real-time Cart Synchronization

- **Automatic reconciliation** - Validates cart against server state
- **Price & stock updates** - Real-time adjustments when changes detected
- **Smart conflict resolution** - Handles stock/price changes gracefully
- **Optimistic updates** - Instant UI feedback with background validation

### 📦 Idempotent Order Processing

- **Duplicate prevention** - UUID-based client action IDs
- **Network retry safety** - Handles retries without duplicate orders
- **Order queuing** - Offline orders queued for automatic sync
- **Temporary order creation** - Immediate order visibility offline

### 📍 Automatic Location Detection

- **GPS-based address** - Auto-fills shipping address using Geolocation API
- **Reverse geocoding** - Converts coordinates to formatted address via OpenStreetMap
- **Manual fallback** - Seamless switch to manual entry when needed
- **Privacy-first** - Requires explicit user permission

### 🗄️ Product Catalog Caching

- **Offline browsing** - Full product catalog available offline
- **Category filtering** - Cached categories for instant filtering
- **Search functionality** - Search products even when offline
- **Automatic refresh** - Updates cache when online

### 🔐 User Authentication

- **JWT-based auth** - Secure token-based authentication
- **Optional authentication** - Anonymous shopping supported
- **Session management** - Persistent login sessions
- **Password security** - bcrypt hashing with 10 rounds

### 🎯 Advanced Features

- **Cart validation** - Pre-checkout validation with reconciliation
- **Order history** - Email-based order lookup and tracking
- **Stock management** - Real-time stock updates and validation
- **Error handling** - Comprehensive error handling and user feedback

---

## 🏗️ Technology Stack

### Frontend

- **React.js** (v19.2.0) - Modern UI framework
- **React Router DOM** (v6.26.0) - Client-side routing
- **Vite** (v7.2.2) - Build tool and dev server
- **IndexedDB** (via idb library) - Client-side persistence
- **Workbox** (v7.1.0) - Service worker and caching strategies
- **Vite PWA Plugin** - PWA configuration and service worker
- **Geolocation API** - Automatic address detection
- **OpenStreetMap Nominatim** - Reverse geocoding

### Backend

- **Node.js** with **Express.js** (v4.18.2)
- **MongoDB** with **Mongoose** (v8.0.3)
- **JWT** (jsonwebtoken v9.0.2) - Authentication
- **Joi** (v17.11.0) - Request validation
- **bcryptjs** (v2.4.3) - Password hashing
- **Helmet.js** (v7.1.0) - Security headers
- **CORS** - Cross-origin resource sharing

### Deployment

- **Vercel** - Serverless functions for API
- **Docker & Docker Compose** - Containerized deployment
- **MongoDB Atlas** - Cloud database (or local MongoDB)

---

## 🏛️ Architecture

### Frontend Architecture

- **Component-based structure** using React
- **Context API** for state management (Cart, Connectivity)
- **Lazy-loaded routes** for code splitting
- **IndexedDB** for persistent offline storage

**State Management:**
- React Context for cart and connectivity
- IndexedDB for persistent data (cart, orders, products, categories)
- Service worker for API response caching
- Action queue for offline operation sync

### Backend Architecture

- **MVC Pattern** - Model-View-Controller structure
- **RESTful API** - Standard HTTP methods
- **Mongoose ODM** - Database abstraction
- **Middleware** - Authentication, validation, error handling

**Database Models:**
- User (authentication)
- Product (catalog)
- Category (organization)
- Order (transactions)

### Offline-First Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    OFFLINE-FIRST ARCHITECTURE               │
└─────────────────────────────────────────────────────────────┘

User Action → IndexedDB (Immediate) → React State Update
                    ↓
            (If Online)
                    ↓
        Service Worker Cache Check
                    ↓
        API Request → Server Validation
                    ↓
        Response → Update IndexedDB → Update UI
                    ↓
        (If Offline)
                    ↓
        Queue Action → Sync When Online
```

### Order Placement Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ORDER PLACEMENT FLOW                     │
└─────────────────────────────────────────────────────────────┘

CHECKOUT FORM
    ↓
[Online?] ──YES──→ Validate Cart → Create Order → Success
    │
   NO
    ↓
Queue Action → Create Temp Order → Redirect to Queued Page
    ↓
[Goes Online]
    ↓
Auto-sync → Replace Temp Order → Clear Queue → Success
```

### Cart Reconciliation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  CART RECONCILIATION FLOW                   │
└─────────────────────────────────────────────────────────────┘

View Cart / Update Quantity
    ↓
[Online?] ──YES──→ Validate Against Server
    │
   NO
    ↓
Continue with Local Cart
    ↓
[Server Response]
    ↓
Changes Detected? ──YES──→ Show Reconciliation Banner
    │                          ↓
   NO                    User Confirms
    ↓                          ↓
Update Cart            Update IndexedDB
```

### Service Worker Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              SERVICE WORKER CACHING STRATEGY                │
└─────────────────────────────────────────────────────────────┘

Request Made
    ↓
[Network First]
    ↓
Try Network (3-10s timeout)
    ↓
[Success?] ──YES──→ Cache Response → Return
    │
   NO
    ↓
Check Cache
    ↓
[Found?] ──YES──→ Return Cached
    │
   NO
    ↓
Return Error / Empty State
```

---

## 🚀 Deployment

PWA Store is optimized for deployment on **Vercel** with serverless functions, but also supports **Docker** deployment.

### Vercel Deployment

- Serverless functions for API endpoints
- Automatic HTTPS
- Global CDN distribution
- Environment variable management

### Docker Deployment

- Containerized backend with MongoDB
- Docker Compose for orchestration
- Persistent data volumes
- Network isolation

---

## 📌 Pros & Benefits

### 🌟 User Experience

✅ **Works offline** - Complete functionality without internet  
✅ **Fast loading** - Service worker caching for instant access  
✅ **Auto-address** - GPS-based shipping address detection  
✅ **Seamless sync** - Automatic data synchronization  
✅ **Installable** - Add to home screen like native app  

### ⚡ Performance

✅ **Optimized caching** - Multiple caching strategies  
✅ **Code splitting** - Lazy-loaded routes  
✅ **IndexedDB** - Fast local data access  
✅ **Network-first** - Fresh data when available  
✅ **Pagination** - Efficient data loading  

### 🔒 Security

✅ **JWT authentication** - Secure token-based auth  
✅ **Password hashing** - bcrypt with 10 rounds  
✅ **Input validation** - Joi schema validation  
✅ **Helmet.js** - Security headers  
✅ **CORS protection** - Origin whitelisting  

### 🚀 Scalability

✅ **Serverless-ready** - Vercel deployment  
✅ **Connection pooling** - MongoDB optimization  
✅ **Database indexes** - Optimized queries  
✅ **Modular architecture** - Easy to scale  

### 🔧 Maintainability

✅ **Clean codebase** - Well-organized structure  
✅ **Comprehensive docs** - Detailed SUMMARY.md  
✅ **Error handling** - Graceful error management  
✅ **Type safety** - Validation at boundaries  

### 📱 Offline Capabilities

✅ **Product browsing** - Full catalog offline  
✅ **Cart management** - Add/remove items offline  
✅ **Order placement** - Queue orders for sync  
✅ **Order history** - View cached orders  
✅ **Automatic sync** - Background synchronization  

---

## 🔮 Future Enhancements

### 🔜 Planned Features

- 💳 **Payment Integration** - Stripe/PayPal integration
- 👤 **User Accounts** - Full user profile management
- 📦 **Order Tracking** - Real-time order status updates
- ⭐ **Product Reviews** - User reviews and ratings
- ❤️ **Wishlist** - Save products for later
- 📧 **Email Notifications** - Order confirmations, status updates
- 🎛️ **Admin Panel** - Product/category management
- 🔍 **Search Improvements** - Full-text search with filters
- 📸 **Image Upload** - User-uploaded product images
- 🌐 **Multi-language** - i18n support
- 📇 **Address Book** - Save multiple shipping addresses
- 🔄 **Order History Sync** - Better offline/online synchronization

### 🔧 Technical Improvements

- 📶 **Enhanced offline support** - More robust offline features
- ⚡ **Performance optimizations** - Further speed improvements
- 🔒 **Enhanced security** - Additional security features
- 🧪 **Testing suite** - Comprehensive test coverage
- 📊 **Analytics** - User behavior tracking

---

## 🎯 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or Atlas)
- npm or yarn package manager

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Nischaya008/pwa-store
cd pwa-store
```

### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pwa-store
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
EOF

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

### 3️⃣ Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
EOF

# Start development server
npm run dev
```

### 4️⃣ Using Docker (Alternative)

```bash
# Start MongoDB and API services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 5️⃣ Open in browser

```
Frontend: http://localhost:5173
Backend API: http://localhost:5000/api
Health Check: http://localhost:5000/api/health
```

---

## 📁 Project Structure

```
pwa-store/
├── api/                    # Vercel serverless function entry point
│   └── index.js           # Serverless wrapper for Express app
├── backend/               # Node.js/Express backend
│   ├── models/           # Mongoose schemas (User, Product, Category, Order)
│   ├── routes/           # API route handlers
│   ├── middleware/       # Auth & validation middleware
│   ├── scripts/          # Database seeding scripts
│   ├── tests/            # API tests (Jest)
│   ├── server.js         # Express server setup
│   └── Dockerfile        # Container configuration
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React Context providers
│   │   ├── utils/        # Utilities (API, DB, queue, geocoding)
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point with SW registration
│   ├── public/           # Static assets & manifest
│   └── vite.config.js    # Vite & PWA configuration
├── vercel.json           # Vercel deployment configuration
└── docker-compose.yml    # Docker Compose configuration
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

---

## 📚 Key Concepts

### Offline-First Architecture

PWA Store is designed to work completely offline. All user actions are immediately saved to IndexedDB, and when connectivity is restored, actions are automatically synchronized with the server.

### Idempotent Orders

Orders use UUID-based `clientActionId` to prevent duplicates. If the same order is submitted multiple times (due to network retries), the server returns the existing order instead of creating a duplicate.

### Cart Reconciliation

Before checkout, the cart is validated against the server. If prices or stock have changed, the user is shown a reconciliation banner with the changes and can choose to update their cart.

### Service Worker Caching

Multiple caching strategies ensure optimal performance:
- **NetworkFirst** for API endpoints (fresh data when available)
- **CacheFirst** for images (fast loading)
- **StaleWhileRevalidate** for products (instant display with background updates)

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to enhance PWA Store. 🚀

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a pull request

### Development Guidelines

- Follow existing code style
- Write comprehensive commit messages
- Add tests for new features
- Update documentation as needed
- Ensure offline functionality works

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

For any inquiries or feedback, reach out via:

- 📧 Email: nischayagarg008@gmail.com
- 🐦 Twitter: [@Nischaya008](https://x.com/Nischaya008)
- 💼 LinkedIn: [Nischaya Garg](https://www.linkedin.com/in/nischaya008/)

---

## 🙏 Acknowledgments

- **OpenStreetMap** for free geocoding services
- **Workbox** for service worker utilities
- **Vite** for the excellent build tooling
- **React** team for the amazing framework

---

**Stay Innovated, Keep Coding, Think BIG! 🚀**

---

## 📊 Project Statistics

- **Frontend**: React 19.2.0, Vite 7.2.2
- **Backend**: Node.js, Express 4.18.2
- **Database**: MongoDB with Mongoose 8.0.3
- **PWA**: Service Worker, IndexedDB, Geolocation API
- **Deployment**: Vercel (Serverless), Docker

---

*Built with ❤️ for offline-first e-commerce experiences*

