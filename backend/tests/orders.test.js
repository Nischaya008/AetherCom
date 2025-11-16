import request from 'supertest';
import app from '../server.js';

describe('Orders API', () => {
  it('should create order with idempotency', async () => {
    const clientActionId = 'test-idempotent-' + Date.now();
    const orderData = {
      clientActionId,
      lineItems: [
        {
          productId: 'test-product-id',
          quantity: 1,
          price: 10.99
        }
      ],
      totalPrice: 10.99,
      shippingAddress: '123 Test St',
      email: 'test@example.com'
    };

    // First request
    const response1 = await request(app)
      .post('/api/orders')
      .send(orderData);

    // Second request with same clientActionId (should be idempotent)
    const response2 = await request(app)
      .post('/api/orders')
      .send(orderData);

    expect(response2.status).toBe(200);
    expect(response2.body.isDuplicate).toBe(true);
  });
});

