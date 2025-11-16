import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// POST /api/orders (idempotent)
router.post('/', optionalAuth, validate(schemas.order), async (req, res, next) => {
  try {
    const { clientActionId, lineItems, totalPrice, shippingAddress, email } = req.body;
    const userId = req.user?.userId || 'anonymous';

    // Check for duplicate order (idempotency)
    const existingOrder = await Order.findOne({ clientActionId }).lean();
    if (existingOrder) {
      return res.json({
        order: existingOrder,
        message: 'Order already processed',
        isDuplicate: true
      });
    }

    // Validate stock and prices
    const adjustedItems = [];
    const removedItems = [];
    let newTotalPrice = 0;
    const validatedItems = [];

    for (const item of lineItems) {
      const product = await Product.findById(item.productId).lean();

      if (!product) {
        removedItems.push({
          productId: item.productId,
          reason: 'Product not found'
        });
        continue;
      }

      if (product.stock < item.quantity) {
        if (product.stock === 0) {
          removedItems.push({
            productId: item.productId,
            name: product.name,
            reason: 'Out of stock'
          });
        } else {
          adjustedItems.push({
            productId: product._id.toString(),
            name: product.name,
            requestedQuantity: item.quantity,
            adjustedQuantity: product.stock,
            oldPrice: item.price,
            newPrice: product.price
          });
        }
        continue;
      }

      if (product.price !== item.price) {
        adjustedItems.push({
          productId: product._id.toString(),
          name: product.name,
          oldPrice: item.price,
          newPrice: product.price
        });
      }

      const itemPrice = product.price * item.quantity;
      newTotalPrice += itemPrice;

      validatedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
        imageURL: product.imageURL
      });
    }

    // If there are adjustments or removals, return reconciliation data
    if (adjustedItems.length > 0 || removedItems.length > 0) {
      return res.status(400).json({
        error: 'Cart needs reconciliation',
        adjustedItems,
        removedItems,
        newTotalPrice
      });
    }

    // If no validated items, return error
    if (validatedItems.length === 0) {
      return res.status(400).json({
        error: 'No valid items in order',
        removedItems
      });
    }

    // Create order
    const order = new Order({
      clientActionId,
      userId,
      lineItems: validatedItems,
      totalPrice: newTotalPrice,
      shippingAddress,
      email,
      status: 'pending'
    });

    // Update stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    await order.save();

    res.status(201).json({
      order: order.toObject(),
      message: 'Order created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key (clientActionId already exists)
      const { clientActionId: actionId } = req.body;
      const existingOrder = await Order.findOne({ clientActionId: actionId }).lean();
      return res.json({
        order: existingOrder,
        message: 'Order already processed',
        isDuplicate: true
      });
    }
    next(error);
  }
});

// GET /api/orders (get orders by email or userId)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { email, userId } = req.query;
    const query = {};

    if (userId && userId !== 'anonymous') {
      query.userId = userId;
    } else if (email) {
      query.email = email;
    } else {
      // If no filter, return empty array (or you could require auth)
      return res.json([]);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('lineItems.productId', 'name imageURL')
      .lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;

