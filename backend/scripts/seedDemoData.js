import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: join(__dirname, '../../backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pwa-store';

const categories = [
  { 
    name: 'Electronics', 
    description: 'Electronic devices, gadgets, and accessories including smartphones, laptops, headphones, and more' 
  },
  { 
    name: 'Clothing', 
    description: 'Fashion apparel for men, women, and kids including t-shirts, jeans, dresses, and accessories' 
  },
  { 
    name: 'Books', 
    description: 'Books covering technology, programming, business, fiction, and educational content' 
  },
  { 
    name: 'Home & Garden', 
    description: 'Home improvement items, furniture, kitchen appliances, and garden supplies' 
  },
  { 
    name: 'Sports & Fitness', 
    description: 'Sports equipment, fitness gear, workout accessories, and athletic wear' 
  }
];

const products = [
  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    price: 99.99,
    stock: 45,
    imageURL: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    description: 'Premium wireless over-ear headphones with active noise cancellation, 30-hour battery life, and superior sound quality. Perfect for music lovers and professionals.'
  },
  {
    name: 'Smart Watch Pro',
    price: 249.99,
    stock: 32,
    imageURL: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    description: 'Feature-rich smartwatch with heart rate monitoring, GPS tracking, sleep analysis, and 7-day battery life. Water-resistant and compatible with iOS and Android.'
  },
  {
    name: 'Ergonomic Laptop Stand',
    price: 49.99,
    stock: 78,
    imageURL: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop',
    description: 'Aluminum laptop stand with adjustable height and angle. Improves posture and workspace ergonomics. Fits laptops up to 17 inches.'
  },
  {
    name: 'Wireless Mouse',
    price: 29.99,
    stock: 120,
    imageURL: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop',
    description: 'Ergonomic wireless mouse with precision tracking, long battery life, and comfortable grip. Perfect for office and gaming use.'
  },
  {
    name: 'USB-C Hub Adapter',
    price: 39.99,
    stock: 65,
    imageURL: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop',
    description: 'Multi-port USB-C hub with HDMI, USB 3.0, SD card reader, and power delivery. Expand your laptop connectivity instantly.'
  },
  {
    name: 'Portable Bluetooth Speaker',
    price: 79.99,
    stock: 55,
    imageURL: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
    description: 'Compact waterproof speaker with 360-degree sound, 12-hour battery, and built-in microphone for hands-free calls.'
  },
  
  // Clothing
  {
    name: 'Classic Cotton T-Shirt',
    price: 19.99,
    stock: 150,
    imageURL: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    description: '100% premium cotton t-shirt with comfortable fit and durable construction. Available in multiple colors. Perfect for everyday wear.'
  },
  {
    name: 'Slim Fit Jeans',
    price: 79.99,
    stock: 85,
    imageURL: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    description: 'Classic slim-fit denim jeans with stretch fabric for comfort and flexibility. Modern cut and premium quality construction.'
  },
  {
    name: 'Hooded Sweatshirt',
    price: 54.99,
    stock: 70,
    imageURL: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    description: 'Cozy hooded sweatshirt made from soft cotton blend. Perfect for casual wear, workouts, or lounging. Available in various colors.'
  },
  {
    name: 'Running Shorts',
    price: 34.99,
    stock: 95,
    imageURL: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=400&fit=crop',
    description: 'Lightweight and breathable running shorts with moisture-wicking fabric. Perfect for jogging, gym workouts, and active sports.'
  },
  {
    name: 'Leather Jacket',
    price: 199.99,
    stock: 25,
    imageURL: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
    description: 'Genuine leather jacket with classic biker style. Premium quality construction, warm lining, and timeless design.'
  },
  
  // Books
  {
    name: 'JavaScript: The Definitive Guide',
    price: 49.99,
    stock: 60,
    imageURL: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
    description: 'Comprehensive guide to JavaScript programming covering ES6+, modern frameworks, and best practices. Essential for web developers.'
  },
  {
    name: 'React.js Complete Guide',
    price: 39.99,
    stock: 55,
    imageURL: 'https://images.unsplash.com/photo-1532619675605-1ede6c7ed94b?w=400&h=400&fit=crop',
    description: 'Learn React from basics to advanced topics including hooks, context API, and performance optimization. Includes practical examples.'
  },
  {
    name: 'Node.js in Action',
    price: 44.99,
    stock: 48,
    imageURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    description: 'Master server-side JavaScript development with Node.js. Covers Express, MongoDB, REST APIs, and deployment strategies.'
  },
  {
    name: 'Clean Code: A Handbook',
    price: 42.99,
    stock: 72,
    imageURL: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop',
    description: 'Learn to write clean, maintainable code. Essential reading for all software developers looking to improve their coding practices.'
  },
  {
    name: 'Full Stack Web Development',
    price: 54.99,
    stock: 40,
    imageURL: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
    description: 'Complete guide to building modern web applications from frontend to backend. Includes MERN stack and deployment.'
  },
  
  // Home & Garden
  {
    name: 'Programmable Coffee Maker',
    price: 89.99,
    stock: 35,
    imageURL: 'https://images.unsplash.com/photo-1517668808823-f325c02db5a4?w=400&h=400&fit=crop',
    description: '12-cup programmable coffee maker with auto-shutoff, timer, and thermal carafe. Start your day with perfect coffee.'
  },
  {
    name: 'Stand Mixer',
    price: 299.99,
    stock: 18,
    imageURL: 'https://images.unsplash.com/photo-1608038221370-7d72b37c53fb?w=400&h=400&fit=crop',
    description: 'Professional stand mixer with multiple attachments. Perfect for baking, mixing, and food preparation. 5-quart capacity.'
  },
  {
    name: 'Air Purifier',
    price: 149.99,
    stock: 42,
    imageURL: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=400&fit=crop',
    description: 'HEPA air purifier with 3-stage filtration system. Removes 99.97% of allergens and pollutants. Covers rooms up to 300 sq ft.'
  },
  {
    name: 'Smart LED Light Bulbs (4-pack)',
    price: 34.99,
    stock: 88,
    imageURL: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=400&fit=crop',
    description: 'WiFi-enabled smart LED bulbs with color-changing capability. Control via app, compatible with Alexa and Google Home.'
  },
  {
    name: 'Plant Pot Set (3-pack)',
    price: 24.99,
    stock: 110,
    imageURL: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    description: 'Modern ceramic plant pots with drainage holes. Three sizes included. Perfect for indoor plants and home decoration.'
  },
  
  // Sports & Fitness
  {
    name: 'Running Shoes',
    price: 129.99,
    stock: 50,
    imageURL: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    description: 'Lightweight running shoes with superior cushioning and breathable mesh upper. Perfect for daily runs and long-distance training.'
  },
  {
    name: 'Yoga Mat',
    price: 29.99,
    stock: 125,
    imageURL: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
    description: 'Non-slip yoga mat with extra cushioning. Eco-friendly TPE material, 6mm thickness. Perfect for yoga, pilates, and workouts.'
  },
  {
    name: 'Dumbbell Set (20lbs)',
    price: 79.99,
    stock: 38,
    imageURL: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    description: 'Adjustable dumbbell set with rubber-coated plates. Space-saving design perfect for home gym workouts.'
  },
  {
    name: 'Resistance Bands Set',
    price: 24.99,
    stock: 92,
    imageURL: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    description: 'Set of 5 resistance bands with different resistance levels. Includes handles and door anchor. Portable and versatile.'
  },
  {
    name: 'Fitness Tracker',
    price: 59.99,
    stock: 67,
    imageURL: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=400&h=400&fit=crop',
    description: 'Activity tracker with heart rate monitor, sleep tracking, and smartphone notifications. Water-resistant and 7-day battery.'
  },
  {
    name: 'Basketball',
    price: 34.99,
    stock: 75,
    imageURL: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop',
    description: 'Official size basketball with premium composite leather. Perfect grip and durability for indoor and outdoor play.'
  }
];

async function seedDemoData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('\nClearing existing data...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Cleared existing data');

    // Seed categories
    console.log('\nCreating categories...');
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    createdCategories.forEach(cat => {
      console.log(`   - ${cat.name}`);
    });

    // Create category lookup map
    const categoryMap = {
      'Electronics': createdCategories.find(c => c.name === 'Electronics'),
      'Clothing': createdCategories.find(c => c.name === 'Clothing'),
      'Books': createdCategories.find(c => c.name === 'Books'),
      'Home & Garden': createdCategories.find(c => c.name === 'Home & Garden'),
      'Sports & Fitness': createdCategories.find(c => c.name === 'Sports & Fitness')
    };

    // Map products to categories
    const productCategoryMap = {
      // Electronics (6 products)
      'Wireless Bluetooth Headphones': 'Electronics',
      'Smart Watch Pro': 'Electronics',
      'Ergonomic Laptop Stand': 'Electronics',
      'Wireless Mouse': 'Electronics',
      'USB-C Hub Adapter': 'Electronics',
      'Portable Bluetooth Speaker': 'Electronics',
      
      // Clothing (5 products)
      'Classic Cotton T-Shirt': 'Clothing',
      'Slim Fit Jeans': 'Clothing',
      'Hooded Sweatshirt': 'Clothing',
      'Running Shorts': 'Clothing',
      'Leather Jacket': 'Clothing',
      
      // Books (5 products)
      'JavaScript: The Definitive Guide': 'Books',
      'React.js Complete Guide': 'Books',
      'Node.js in Action': 'Books',
      'Clean Code: A Handbook': 'Books',
      'Full Stack Web Development': 'Books',
      
      // Home & Garden (5 products)
      'Programmable Coffee Maker': 'Home & Garden',
      'Stand Mixer': 'Home & Garden',
      'Air Purifier': 'Home & Garden',
      'Smart LED Light Bulbs (4-pack)': 'Home & Garden',
      'Plant Pot Set (3-pack)': 'Home & Garden',
      
      // Sports & Fitness (6 products)
      'Running Shoes': 'Sports & Fitness',
      'Yoga Mat': 'Sports & Fitness',
      'Dumbbell Set (20lbs)': 'Sports & Fitness',
      'Resistance Bands Set': 'Sports & Fitness',
      'Fitness Tracker': 'Sports & Fitness',
      'Basketball': 'Sports & Fitness'
    };

    // Seed products
    console.log('\nCreating products...');
    const productsWithCategories = products.map(product => {
      const categoryName = productCategoryMap[product.name];
      const category = categoryMap[categoryName];
      
      if (!category) {
        console.warn(`⚠️  Warning: Category not found for product: ${product.name}`);
      }
      
      return {
        ...product,
        categoryId: category?._id || categoryMap['Electronics']._id // Fallback to Electronics
      };
    });

    const createdProducts = await Product.insertMany(productsWithCategories);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SEED SUMMARY');
    console.log('='.repeat(50));
    console.log(`Categories: ${createdCategories.length}`);
    console.log(`Products: ${createdProducts.length}`);
    console.log('\nProducts by category:');
    for (const [catName, category] of Object.entries(categoryMap)) {
      const count = createdProducts.filter(p => p.categoryId.equals(category._id)).length;
      console.log(`   ${catName}: ${count} products`);
    }
    console.log('\n✅ Demo data seeded successfully!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed error:', error);
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 Tip: Check your MongoDB URI in .env file');
      console.error('   Make sure the password is URL-encoded (e.g., @ becomes %40)');
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData();
}

export default seedDemoData;

