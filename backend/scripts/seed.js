import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pwa-store';

const categories = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Clothing', description: 'Fashion and apparel' },
  { name: 'Books', description: 'Books and literature' },
  { name: 'Home & Garden', description: 'Home and garden supplies' },
  { name: 'Sports', description: 'Sports and fitness equipment' }
];

const products = [
  {
    name: 'Wireless Headphones',
    price: 99.99,
    stock: 50,
    imageURL: 'https://via.placeholder.com/400x400?text=Headphones',
    description: 'High-quality wireless headphones with noise cancellation'
  },
  {
    name: 'Smart Watch',
    price: 249.99,
    stock: 30,
    imageURL: 'https://via.placeholder.com/400x400?text=Smart+Watch',
    description: 'Feature-rich smartwatch with health tracking'
  },
  {
    name: 'Laptop Stand',
    price: 49.99,
    stock: 75,
    imageURL: 'https://via.placeholder.com/400x400?text=Laptop+Stand',
    description: 'Ergonomic laptop stand for better posture'
  },
  {
    name: 'Cotton T-Shirt',
    price: 19.99,
    stock: 100,
    imageURL: 'https://via.placeholder.com/400x400?text=T-Shirt',
    description: 'Comfortable 100% cotton t-shirt'
  },
  {
    name: 'Jeans',
    price: 79.99,
    stock: 60,
    imageURL: 'https://via.placeholder.com/400x400?text=Jeans',
    description: 'Classic fit denim jeans'
  },
  {
    name: 'Running Shoes',
    price: 129.99,
    stock: 40,
    imageURL: 'https://via.placeholder.com/400x400?text=Running+Shoes',
    description: 'Comfortable running shoes with cushioning'
  },
  {
    name: 'JavaScript Guide',
    price: 29.99,
    stock: 80,
    imageURL: 'https://via.placeholder.com/400x400?text=JS+Guide',
    description: 'Complete guide to modern JavaScript'
  },
  {
    name: 'React Cookbook',
    price: 34.99,
    stock: 45,
    imageURL: 'https://via.placeholder.com/400x400?text=React+Cookbook',
    description: 'Practical recipes for React development'
  },
  {
    name: 'Coffee Maker',
    price: 89.99,
    stock: 25,
    imageURL: 'https://via.placeholder.com/400x400?text=Coffee+Maker',
    description: 'Programmable coffee maker with timer'
  },
  {
    name: 'Yoga Mat',
    price: 24.99,
    stock: 90,
    imageURL: 'https://via.placeholder.com/400x400?text=Yoga+Mat',
    description: 'Non-slip yoga mat for home workouts'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Seed categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Map products to categories
    const categoryMap = {
      'Electronics': ['Wireless Headphones', 'Smart Watch', 'Laptop Stand'],
      'Clothing': ['Cotton T-Shirt', 'Jeans'],
      'Books': ['JavaScript Guide', 'React Cookbook'],
      'Home & Garden': ['Coffee Maker'],
      'Sports': ['Running Shoes', 'Yoga Mat']
    };

    // Seed products
    const productsWithCategories = products.map(product => {
      const categoryName = Object.keys(categoryMap).find(cat =>
        categoryMap[cat].includes(product.name)
      );
      const category = createdCategories.find(c => c.name === categoryName);
      return {
        ...product,
        categoryId: category._id
      };
    });

    const createdProducts = await Product.insertMany(productsWithCategories);
    console.log(`Created ${createdProducts.length} products`);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

