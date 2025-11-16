import express from 'express';
import Product from '../models/Product.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/products?page=&limit=&search=&category=
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    const query = {};

    if (category) {
      query.categoryId = category;
    }

    // Enhanced search with fuzzy matching and multiple fields
    if (search) {
      const searchRegex = new RegExp(search.split(' ').join('|'), 'i');
      
      // Use $or for fuzzy matching across name and description
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
      
      // Also use text search if available for relevance scoring
      const textQuery = { ...query };
      textQuery.$text = { $search: search };
      
      // Try text search first for better relevance, fallback to regex if text search fails
      try {
        const [textProducts, total] = await Promise.all([
          Product.find(textQuery)
            .populate('categoryId', 'name')
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .lean(),
          Product.countDocuments(textQuery)
        ]);
        
        if (textProducts.length > 0) {
          return res.json({
            products: textProducts,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit)
            }
          });
        }
      } catch (textError) {
        // If text search fails (e.g., no text index), use regex search
        console.log('Text search not available, using regex search');
      }
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .sort(search ? { name: 1 } : { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name description')
      .lean();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

export default router;

