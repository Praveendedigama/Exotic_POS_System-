const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected! (Cloud)'))
  .catch(err => console.error('❌ Cloud Connection Error:', err));

// --- MODELS ---
const ProductSchema = new mongoose.Schema({
  colorName: String, 
  unitWeight: Number, 
  unitPrice: Number, 
  stockCount: { type: Number, default: 0 }
});
const Product = mongoose.model('Product', ProductSchema);

const TransactionSchema = new mongoose.Schema({
  customerName: String,
  date: String,
  status: String, // Paid, Credit, Partial
  totalAmount: Number,
  paidAmount: { type: Number, default: 0 }, // අලුතින් එකතු කල කොටස (ගෙවූ මුදල)
  items: Array
}, { timestamps: true });
const Transaction = mongoose.model('Transaction', TransactionSchema);

// --- ROUTES ---

// 1. Products (GET, POST, PUT, DELETE)
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.json(newProduct);
});

// Edit Product
app.put('/api/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Transactions (GET, POST)
app.get('/api/sales', async (req, res) => {
  const sales = await Transaction.find().sort({ createdAt: -1 });
  res.json(sales);
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { customerName, date, status, items, totalAmount, paidAmount } = req.body;

    const newTransaction = new Transaction({
      customerName, date, status, items, totalAmount, paidAmount
    });
    await newTransaction.save();

    // Stock Update Logic
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stockCount: -item.quantity } }
      );
    }
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// --- SYSTEM RESET ROUTE (DANGER ZONE) ---
app.post('/api/reset', async (req, res) => {
  try {
    await Product.deleteMany({});      // සියලුම බඩු මකන්න
    await Transaction.deleteMany({});  // සියලුම බිල්පත් මකන්න
    res.json({ message: "System Fully Reset" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});