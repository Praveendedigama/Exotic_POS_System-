const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  colorName: { type: String, required: true }, // උදා: Red
  unitWeight: { type: Number, required: true }, // උදා: 9 (g)
  unitPrice: { type: Number, required: true }, // උදා: 3000
  stockCount: { type: Number, default: 0 }     // උදා: 50
});

module.exports = mongoose.model('Product', productSchema);