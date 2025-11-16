import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  imageURL: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ categoryId: 1 });
// Text index for search (includes name and description for better search results)
productSchema.index({ name: 'text', description: 'text' });
// Regular index for name for regex searches
productSchema.index({ name: 1 });

export default mongoose.model('Product', productSchema);

