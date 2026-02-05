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
  note: String,
  repaymentHistory: [{ date: String, amount: Number }],
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

// --- USER SCHEMA ---

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // සරලව තියමු (Real world එකේදී Encrypt කරන්න ඕන)
  role: { type: String, enum: ['admin', 'manager', 'clerk'], default: 'clerk' } 
});

const User = mongoose.model('User', UserSchema);



// --- ROUTES ---

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      // Password match නම් user විස්තර යවන්න
      res.json({ username: user.username, role: user.role }); 
    } else {
      res.status(401).json({ error: "Invalid Credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create New User (Admin Only)
app.post('/api/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// --- UPDATE TRANSACTION (REPAYMENT) ---
app.put('/api/transactions/:id/repay', async (req, res) => {
  try {
    const { amount } = req.body;
    const sale = await Transaction.findById(req.params.id);

    if (!sale) return res.status(404).json({ message: "Transaction not found" });

    const newPaidAmount = sale.paidAmount + parseFloat(amount);
    if (newPaidAmount > sale.totalAmount) {
      return res.status(400).json({ message: "Payment exceeds total amount!" });
    }

    // ✅ ගෙවන දිනය සහ ගාන වෙනම ලියලා තියාගන්නවා
    const today = new Date().toISOString().split('T')[0];
    sale.repaymentHistory.push({ date: today, amount: parseFloat(amount) });

    sale.paidAmount = newPaidAmount;
    sale.status = sale.paidAmount >= sale.totalAmount ? 'Paid' : 'Partial';

    await sale.save();
    res.json(sale);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 3. UPDATE NOTE ROUTE (මේක අලුතින්ම එකතු කරන්න)
app.put('/api/transactions/:id/note', async (req, res) => {
  try {
    const { note } = req.body;
    await Transaction.findByIdAndUpdate(req.params.id, { note: note });
    res.json({ message: "Note updated successfully" });
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
    const { customerName, date, status, items, totalAmount, paidAmount, note } = req.body;

    const newTransaction = new Transaction({
      customerName, date, status, items, totalAmount, paidAmount, note,
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

// --- SYSTEM RESET ROUTE ---
// app.post('/api/reset', async (req, res) => {
//   try {
//     // 1. Transactions (විකුණුම්) ඔක්කොම මකන්න
//     await Transaction.deleteMany({});
    
//     // 2. Batch History (පරණ රෙකෝඩ්ස්) ඔක්කොම මකන්න
//     await Batch.deleteMany({});
    
//     // 3. Products (Inventory) එකත් මකන්න ඕන නම් විතරක් මේ පේළිය uncomment කරන්න:
//     // await Product.deleteMany({}); 

//     // 4. Products වල Stock එක ආපහු බිංදුවට (0) හදන්න ඕන නම් මේක පාවිච්චි කරන්න (Optional)
//     await Product.updateMany({}, { stockCount: 0 });

//     console.log("♻️ System Data Cleared (Inventory Kept Safe)");
//     res.json({ message: "Sales & History Cleared Successfully!" });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });