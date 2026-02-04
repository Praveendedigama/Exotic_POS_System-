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

// --- UPDATED TRANSACTION SCHEMA ---
const TransactionSchema = new mongoose.Schema({
  customerName: String,
  date: String,
  status: String,
  totalAmount: Number,
  paidAmount: { type: Number, default: 0 },
  items: Array,
  isDeleted: { type: Boolean, default: false }, // [NEW] Soft Delete Flag
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

const BatchSchema = new mongoose.Schema({
  batchName: String, // උදා: Batch #1 (Jan - Feb)
  startDate: String,
  endDate: String,
  totalSales: Number,
  totalCollected: Number,
  totalDue: Number,
  transactionCount: Number,
  itemsSummary: { type: Object, default: {} }
}, { timestamps: true });

const Batch = mongoose.model('Batch', BatchSchema);

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

app.put('/api/transactions/:id/delete', async (req, res) => {
    try {
        // Find and mark as deleted (Soft Delete)
        // Stock එක ආපහු Reverse කරන්නේ නෑ (Return Feature එකක් නෙවෙයි නිසා)
        const transaction = await Transaction.findByIdAndUpdate(
            req.params.id, 
            { isDeleted: true }, 
            { new: true }
        );
        res.json(transaction);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- 2. NEW ROUTES FOR BATCHES ---

// Get All Past Batches
app.get('/api/batches', async (req, res) => {
  const batches = await Batch.find().sort({ createdAt: -1 });
  res.json(batches);
});

// End Current Batch (Move active sales to history)
// --- 2. UPDATED END BATCH ROUTE ---
app.post('/api/batches/end', async (req, res) => {
  try {
    const activeTransactions = await Transaction.find({ isDeleted: false, isArchived: false });

    if (activeTransactions.length === 0) {
      return res.status(400).json({ error: "No active transactions to archive" });
    }

    let totalSales = 0;
    let totalCollected = 0;
    let totalDue = 0;
    // [NEW] Item Counting Logic
    let itemsSummary = {}; 

    const startDate = activeTransactions[0].date;
    const endDate = new Date().toISOString().split('T')[0];

    activeTransactions.forEach(t => {
       const paid = t.paidAmount !== undefined ? t.paidAmount : (t.status === 'Paid' ? t.totalAmount : 0);
       totalSales += t.totalAmount;
       totalCollected += paid;
       totalDue += (t.totalAmount - paid);

       // [NEW] Loop through items and count colors
       t.items.forEach(item => {
           const color = item.colorName || 'Unknown';
           const qty = parseInt(item.quantity) || parseInt(item.qty) || 0;
           
           if (itemsSummary[color]) {
               itemsSummary[color] += qty;
           } else {
               itemsSummary[color] = qty;
           }
       });
    });

    const batchCount = await Batch.countDocuments();
    const newBatch = new Batch({
      batchName: `Batch #${batchCount + 1}`,
      startDate,
      endDate,
      totalSales,
      totalCollected,
      totalDue,
      transactionCount: activeTransactions.length,
      itemsSummary // [NEW] Save the calculated summary
    });
    
    await newBatch.save();

    await Transaction.updateMany(
      { isDeleted: false, isArchived: false },
      { isArchived: true }
    );

    res.json({ message: "Batch Ended Successfully", batch: newBatch });

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
    // await Product.deleteMany({});      // සියලුම බඩු මකන්න
    await Transaction.deleteMany({});  // සියලුම බිල්පත් මකන්න
    res.json({ message: "System Fully Reset" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});