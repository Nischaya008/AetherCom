import { describe, it, expect } from 'vitest';
import { createAction, ACTION_TYPES } from '../queue.js';

describe('Queue operations', () => {
  it('should create action with correct structure', () => {
    const payload = { productId: 'test-1', quantity: 1 };
    const action = createAction(ACTION_TYPES.ADD_TO_CART, payload);

    expect(action).toHaveProperty('id');
    expect(action).toHaveProperty('type', ACTION_TYPES.ADD_TO_CART);
    expect(action).toHaveProperty('payload', payload);
    expect(action).toHaveProperty('timestamp');
  });

  it('should create unique action IDs', () => {
    const payload = { productId: 'test-1' };
    const action1 = createAction(ACTION_TYPES.ADD_TO_CART, payload);
    const action2 = createAction(ACTION_TYPES.ADD_TO_CART, payload);

    expect(action1.id).not.toBe(action2.id);
  });
});

