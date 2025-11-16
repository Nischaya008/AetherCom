import express from 'express';
import Category from '../models/Category.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/categories
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

export default router;

