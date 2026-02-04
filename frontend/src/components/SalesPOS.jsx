import React, { useState } from 'react';
import axios from 'axios';
import { Save } from 'lucide-react';

// const API_URL = 'http://localhost:5000/api';

const SalesPOS = ({ products, fetchData, API_URL }) => {
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState([]); 
  
  // මේක තමයි දැනට තෝරාගෙන ඉන්න item එක (Temporary Holder)
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [paidAmount, setPaidAmount] = useState('');

  // --- HELPER: පාට බෝල වලට අදාල CSS පාට ---
  const getBallColor = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('blue') || n.includes('white')) return 'bg-blue-500';
    if (n.includes('red')) return 'bg-red-500';
    if (n.includes('yellow')) return 'bg-yellow-500';
    if (n.includes('green')) return 'bg-green-500';
    return 'bg-gray-400';
  };

  // --- FUNCTION: බඩු Cart එකට එකතු කිරීම ---
  const addToCart = () => {
    if (!selectedProduct) return alert("Please select a color first!");
    if (qty <= 0) return alert("Quantity must be at least 1");
    
    // Stock Check (Validation)
    // දැනටමත් Cart එකේ මේ ජාතියේ ඒවා තියෙනවද බලන්න
    const existingItem = cart.find(item => item.productId === selectedProduct._id);
    const currentCartQty = existingItem ? existingItem.qty : 0;
    
    if ((currentCartQty + qty) > selectedProduct.stockCount) {
      return alert(`Cannot add! Only ${selectedProduct.stockCount} items available in stock.`);
    }

    // Cart එක Update කිරීම
    if (existingItem) {
      const updatedCart = cart.map(item => 
        item.productId === selectedProduct._id 
        ? { ...item, qty: item.qty + qty } 
        : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { 
        productId: selectedProduct._id, 
        colorName: selectedProduct.colorName,
        price: selectedProduct.unitPrice, 
        qty: qty 
      }]);
    }
    
    // Reset Inputs
    setQty(1);
    setSelectedProduct(null);
  };

  // --- FUNCTION: Cart එකෙන් අයින් කිරීම ---
  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  // --- CALCULATIONS ---
  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const balance = total - (parseFloat(paidAmount) || 0);

  // --- UPDATED HANDLE CHECKOUT (FIXED) ---
  const handleCheckout = async () => {
    if (!customer) return alert("Customer Name Required");
    if (cart.length === 0) return alert("Cart is empty!");

    const paid = parseFloat(paidAmount) || 0;
    let status = 'Paid';
    if (paid === 0) status = 'Credit';
    else if (paid < total) status = 'Partial';

    // [FIX] Backend එකට ගැලපෙන ලෙස qty -> quantity ලෙස වෙනස් කිරීම
    const payload = {
      customerName: customer, 
      date, 
      status, 
      totalAmount: total, 
      paidAmount: paid,
      items: cart.map(item => ({
        productId: item.productId,
        colorName: item.colorName,
        price: item.price,
        quantity: item.qty  // මෙතන තමයි වෙනස!
      }))
    };

    try {
      await axios.post(`${API_URL}/transactions`, payload);
      alert("Sale Recorded! ✅");
      
      // Reset All
      setCart([]); 
      setCustomer(''); 
      setPaidAmount(''); 
      setSelectedProduct(null); 
      setQty(1);
      fetchData(); 
    } catch (error) {
      console.error(error);
      alert("Sale Failed! Check console for details.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT SIDE: Product Selection */}
      <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-gray-800">New Transaction</h2>
        
        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase">Customer Name</label>
            <input type="text" placeholder="Enter Name" value={customer} onChange={e=>setCustomer(e.target.value)} className="w-full border p-3 rounded-lg mt-1 focus:ring-2 ring-blue-100 outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase">Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border p-3 rounded-lg mt-1 focus:ring-2 ring-blue-100 outline-none" />
          </div>
        </div>

        {/* 1. COLOR BALLS SELECTION (New UI) */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Select Product Color</label>
          <div className="flex flex-wrap gap-4">
            {products.map(p => (
              <button 
                key={p._id}
                onClick={() => {
                  setSelectedProduct(p);
                  setQty(1); // Reset qty on change
                }}
                disabled={p.stockCount <= 0}
                className={`relative group transition-all duration-200 ${selectedProduct?._id === p._id ? 'ring-4 ring-offset-2 ring-blue-500 scale-105' : 'hover:scale-105'}`}
              >
                {/* The Ball */}
                <div className={`w-16 h-16 rounded-full shadow-md flex items-center justify-center ${getBallColor(p.colorName)} ${p.stockCount <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  {/* Price Tag inside Ball */}
                  <span className="text-white font-bold text-xs drop-shadow-md">Rs.{p.unitPrice/1000}k</span>
                </div>
                {/* Label below */}
                <span className="text-xs font-medium text-gray-600 mt-1 block text-center">{p.colorName}</span>
                {/* Stock Badge */}
                <span className={`absolute -top-1 -right-1 text-[10px] px-2 py-0.5 rounded-full text-white font-bold shadow-sm ${p.stockCount > 0 ? 'bg-gray-800' : 'bg-red-500'}`}>
                  {p.stockCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. QUANTITY STEPPER & ADD BUTTON */}
        {selectedProduct && (
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-6 animation-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${getBallColor(selectedProduct.colorName)}`}></div>
              <div>
                <h4 className="font-bold text-gray-800">{selectedProduct.colorName}</h4>
                <p className="text-xs text-gray-500">Available: {selectedProduct.stockCount}</p>
              </div>
            </div>

            {/* Stepper Control */}
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
              <button 
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold text-lg rounded-l-lg"
              >-</button>
              <input 
                type="number" 
                value={qty} 
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  // Direct Input Validation
                  if (val > selectedProduct.stockCount) {
                    alert(`Max stock is ${selectedProduct.stockCount}`);
                    setQty(selectedProduct.stockCount);
                  } else {
                    setQty(val);
                  }
                }}
                className="w-16 text-center border-x border-gray-200 py-2 font-bold outline-none"
              />
              <button 
                onClick={() => setQty(q => Math.min(selectedProduct.stockCount, q + 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold text-lg rounded-r-lg"
              >+</button>
            </div>

            <button 
              onClick={addToCart}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all"
            >
              Add to Bill
            </button>
          </div>
        )}

        {/* 3. CURRENT CART ITEMS */}
        {cart.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Bill Items</h4>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getBallColor(item.colorName)}`}></div>
                    <span className="font-medium text-gray-700">{item.colorName} <span className="text-gray-400 text-xs">x {item.qty}</span></span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-800">Rs. {(item.price * item.qty).toLocaleString()}</span>
                    <button onClick={() => removeFromCart(index)} className="text-red-500 hover:bg-red-50 p-1 rounded">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Payment Summary (No Changes to Logic, just UI Polish) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
        <h3 className="text-lg font-bold mb-6 text-gray-800 border-b pb-2">Payment Summary</h3>
        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-xl font-bold text-gray-800">
            <span>Total Amount</span>
            <span>Rs. {total.toLocaleString()}</span>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <label className="text-xs text-blue-600 font-bold uppercase block mb-1">Amount Paid (Rs)</label>
            <input 
              type="number" 
              value={paidAmount} 
              onChange={e=>setPaidAmount(e.target.value)} 
              className="w-full bg-white border border-blue-200 p-2 rounded text-right font-bold text-lg outline-none focus:ring-2 ring-blue-300" 
              placeholder="0" 
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-500 font-medium">Balance Due</span>
            <span className={`text-lg font-bold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
              Rs. {balance > 0 ? balance.toLocaleString() : 0}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase 
              ${balance <= 0 ? 'bg-green-100 text-green-700' : (parseFloat(paidAmount)>0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}`}>
              {balance <= 0 ? 'Paid' : (parseFloat(paidAmount)>0 ? 'Partial' : 'Credit')}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleCheckout} 
          disabled={cart.length === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex justify-center items-center gap-2
            ${cart.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-200'}`}
        >
          <Save size={20} /> Complete Sale
        </button>
      </div>
    </div>
  );
};

export default SalesPOS;