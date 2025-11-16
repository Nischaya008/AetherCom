# PWA Store

![PWA Store Banner](https://github.com/Nischaya008/Image_hosting/blob/main/Screenshot%202025-11-16%20191009.png?raw=true)

🚀 **PWA Store** is a full-stack, offline-first e-commerce Progressive Web App designed to deliver a seamless shopping experience—even across unstable or zero network conditions. With intelligent caching, cart reconciliation, idempotent order processing, automatic location detection, and a resilient offline action queue, PWA Store ensures your users can browse, shop, and place orders anytime.

## 🌟 Features

### 🔥 Offline-First Architecture
- Browse products, categories & product details offline  
- Complete cart management offline  
- Orders can be placed offline and synced later  
- Service Worker-driven caching + IndexedDB persistence  

### ⚡ Intelligent Cart Reconciliation
- Detects stock changes, price updates & unavailable products  
- Displays real-time reconciliation UI  
- Prevents invalid or stale checkouts  

### 🛒 Idempotent Order Processing
- UUID-based idempotent order creation  
- Duplicate submissions prevented  
- Reliable retry mechanism for offline orders  

### 🌍 Automatic Location Detection
- Uses browser Geolocation API  
- Reverse-geocodes address using **OpenStreetMap Nominatim**  
- Manual fallback mode available (especially offline)  

### 📦 Offline Product & Category Cache
- Products & categories stored in IndexedDB  
- Persistent offline browsing  
- Automatic refresh when online  

### 📱 Modern PWA Experience
- Installable on mobile & desktop  
- Fast startup with precaching  
- Background updates  
- Responsive UI with React 19  

## 🏗️ Technology Stack

### Frontend
- React 19.2.0  
- React Router DOM 6.26.0  
- Vite 7.2.2  
- IndexedDB (idb library)  
- Workbox 7.1.0  
- Vite PWA Plugin  
- Tailwind CSS  
- OpenStreetMap Nominatim  

### Backend
- Node.js 18+  
- Express.js  
- MongoDB + Mongoose 8.0.3  
- JWT Authentication  
- Joi Validation  
- bcryptjs  
- Serverless-ready  

### Deployment
- Vercel  
- Docker  
- MongoDB Atlas  

## 🏛️ Architecture

### Frontend Architecture
- Component-driven  
- IndexedDB for persistence  
- PWA service worker strategy  
- Connectivity detection  
- Automatic location detection  

### Backend Architecture
- MVC structure  
- Stateless REST API  
- Idempotent order creation  
- Validation & Auth middleware  

## 🔄 Core Workflows

### 🛒 Cart Synchronization
```
User Adds/Updates Cart
        ↓
IndexedDB Updated
        ↓
React State Updated
        ↓
(If Online)
Validate Cart
        ↓
Changes?
        ↓
Yes → Reconciliation UI → Apply Changes
```

### 📦 Order Placement (Online)
```
Checkout Form
        ↓
Validate Cart
        ↓
Valid? → Create Order
        ↓
Stock Update → Save Order → Cache → Success Page
```

### 📡 Order Placement (Offline)
```
Checkout Form
        ↓
Create Temp Order
        ↓
Queue Action
        ↓
Clear Cart
        ↓
Queued Page
        ↓
(Online) Replay Action
        ↓
Success? Replace Temp Order
```

### 🧭 Location Detection
```
Load Page
        ↓
Geolocation Request
        ↓
Reverse Geocode (OSM)
        ↓
Auto-fill Address
```

## 📂 File Structure

```
ansh/
├── api/
├── backend/
├── frontend/
└── vercel.json
```

## 🚀 Deployment

Optimized for Vercel serverless deployment.

## 📌 Pros & Benefits

### User Experience
- Works offline  
- Auto-location  
- Installable PWA  

### Performance
- IndexedDB caching  
- SW runtime caching  
- Lazy-loaded components  

### Security
- JWT  
- Sanitized inputs  
- CORS + Helmet  

### Scalability
- Serverless backend  
- Optimized DB queries  

### Maintainability
- Modular architecture  
- Strong validation  
- SW update flow  

## 🔮 Future Enhancements
- Payment Gateway  
- Admin Panel  
- Wishlist  
- Reviews  
- i18n  
- Saved addresses  
- Push notifications  

## 🎯 Getting Started

### Clone
```
git clone <your-repo-url>
```

### Backend
```
cd backend
npm install
npm run dev
```

### Frontend
```
cd frontend
npm install
npm run dev
```

### Open
```
http://localhost:5173
```

## 🤝 Contributing

Fork → Branch → Commit → PR.

## 📝 License

MIT License.

## 📞 Contact

- Email: nischayagarg008@gmail.com  
- Twitter: @Nischaya008  
- LinkedIn: Nischaya Garg  

Stay Offline-Ready. Stay Resilient. Stay Future-Proof. 🚀
