import express from 'express';
import Product from '../models/Product.js';
import { validate, schemas } from '../middleware/validation.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/cart/validate
router.post('/validate', optionalAuth, validate(schemas.cartValidate), async (req, res, next) => {
  try {
    const { items } = req.body;

    const adjustedItems = [];
    const removedItems = [];
    let newTotalPrice = 0;
    let hasChanges = false;

    for (const item of items) {
      const product = await Product.findById(item.productId).lean();

      if (!product) {
        removedItems.push({
          productId: item.productId,
          reason: 'Product not found'
        });
        hasChanges = true;
        continue;
      }

      if (product.stock === 0) {
        removedItems.push({
          productId: item.productId,
          name: product.name,
          reason: 'Out of stock'
        });
        hasChanges = true;
        continue;
      }

      const requestedQuantity = item.quantity;
      const availableQuantity = Math.min(requestedQuantity, product.stock);
      const itemPrice = product.price * availableQuantity;
      const cartPrice = item.price || product.price; // Use cart price if provided, else product price

      // Only flag as changed if quantity needs adjustment OR if price changed significantly (more than 1 cent difference)
      const priceChanged = cartPrice && Math.abs(cartPrice - product.price) > 0.01;
      
      if (availableQuantity !== requestedQuantity || (priceChanged && availableQuantity > 0)) {
        hasChanges = true;
        adjustedItems.push({
          productId: product._id.toString(),
          name: product.name,
          imageURL: product.imageURL,
          requestedQuantity,
          adjustedQuantity: availableQuantity,
          oldPrice: cartPrice || product.price,
          newPrice: product.price,
          oldSubtotal: (cartPrice || product.price) * requestedQuantity,
          newSubtotal: itemPrice
        });
      }

      newTotalPrice += itemPrice;
    }

    res.json({
      valid: !hasChanges,
      hasChanges,
      adjustedItems,
      removedItems,
      newTotalPrice
    });
  } catch (error) {
    next(error);
  }
});

export default router;

