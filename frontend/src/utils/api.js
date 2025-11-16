// Use relative URL in production (same domain), or env variable, or localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Products API
export const fetchProducts = async (params = {}) => {
  const { page = 1, limit = 20, search = '', category = '' } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category && { category })
  });

  const response = await fetch(`${API_BASE_URL}/products?${queryParams}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
};

export const fetchProduct = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }

  return response.json();
};

// Categories API
export const fetchCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
};

// Cart validation API
export const validateCart = async (items) => {
  const response = await fetch(`${API_BASE_URL}/cart/validate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ items })
  });

  if (!response.ok) {
    throw new Error('Failed to validate cart');
  }

  return response.json();
};

// Orders API
export const createOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw { ...errorData, status: response.status };
  }

  return response.json();
};

export const fetchOrder = async (id) => {
  const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }

  return response.json();
};

export const fetchOrders = async (email) => {
  if (!email) return [];
  
  const response = await fetch(`${API_BASE_URL}/orders?email=${encodeURIComponent(email)}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
};

// Auth API
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
};

export const register = async (username, email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
};

