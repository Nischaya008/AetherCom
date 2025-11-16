import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, addToCart, getCart, clearCart } from '../db.js';

describe('IndexedDB operations', () => {
  beforeEach(async () => {
    await clearCart();
  });

  it('should initialize database', async () => {
    const db = await initDB();
    expect(db).toBeDefined();
    expect(db.name).toBe('pwa-store-db');
  });

  it('should add item to cart', async () => {
    const item = {
      productId: 'test-1',
      quantity: 1,
      price: 10.99,
      name: 'Test Product',
      imageURL: 'https://example.com/image.jpg'
    };

    await addToCart(item);
    const cart = await getCart();

    expect(cart).toHaveLength(1);
    expect(cart[0].productId).toBe('test-1');
    expect(cart[0].quantity).toBe(1);
  });

  it('should update quantity when adding same product', async () => {
    const item = {
      productId: 'test-1',
      quantity: 1,
      price: 10.99,
      name: 'Test Product',
      imageURL: 'https://example.com/image.jpg'
    };

    await addToCart(item);
    await addToCart(item);

    const cart = await getCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });
});

