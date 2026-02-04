const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  date: { type: String, required: true }, // Date string ලෙස තියාගමු
  status: { type: String, enum: ['Paid', 'Credit'], default: 'Paid' },
  totalAmount: { type: Number, required: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      colorName: String, // වාර්තා බලද්දී ලෙසි වෙන්න නම මෙතනත් save කරමු
      quantity: Number,
      price: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);