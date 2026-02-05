import React, { useState } from 'react';
import axios from 'axios';
import { Save, Plus, Minus, Trash2, X, FileText } from 'lucide-react';

const SalesPOS = ({ products, fetchData, API_URL }) => {
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(''); // ✅ Note State එක
  const [cart, setCart] = useState([]); 
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [paidAmount, setPaidAmount] = useState('');

  const getColor = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('blue') || n.includes('white')) return '#3b82f6';
    if (n.includes('red')) return '#ef4444';
    if (n.includes('yellow')) return '#eab308';
    if (n.includes('green')) return '#22c55e';
    return '#94a3b8';
  };

  const addToCart = () => {
    if (!selectedProduct) return alert("Please select a product!");
    if (qty <= 0) return alert("Quantity must be at least 1");
    
    const existingItem = cart.find(item => item.productId === selectedProduct._id);
    const currentCartQty = existingItem ? existingItem.qty : 0;
    
    if ((currentCartQty + qty) > selectedProduct.stockCount) {
      return alert(`Only ${selectedProduct.stockCount} items available.`);
    }

    if (existingItem) {
      setCart(cart.map(item => item.productId === selectedProduct._id ? { ...item, qty: item.qty + qty } : item));
    } else {
      setCart([...cart, { 
        productId: selectedProduct._id, 
        colorName: selectedProduct.colorName,
        price: selectedProduct.unitPrice, 
        qty: qty 
      }]);
    }
    
    setQty(1);
    setSelectedProduct(null);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (!customer) return alert("Customer Name Required");
    if (cart.length === 0) return alert("Cart is empty!");

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const paid = parseFloat(paidAmount) || 0;
    
    let status = 'Paid';
    if (paid === 0) status = 'Credit';
    else if (paid < total) status = 'Partial';

    const payload = {
      customerName: customer, 
      date, 
      status, 
      totalAmount: total, 
      paidAmount: paid,
      note: note, // ✅ Note එක Backend එකට යවනවා
      items: cart.map(item => ({
        productId: item.productId,
        colorName: item.colorName,
        price: item.price,
        quantity: item.qty
      }))
    };

    try {
      await axios.post(`${API_URL}/transactions`, payload);
      alert("Sale Completed! ✅");
      // Reset All
      setCart([]); setCustomer(''); setPaidAmount(''); setNote(''); setSelectedProduct(null); setQty(1);
      fetchData(); 
    } catch (error) {
      alert("Sale Failed! Check connection.");
    }
  };

  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const balance = total - (parseFloat(paidAmount) || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
      
      {/* --- LEFT SIDE (PRODUCTS) --- */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-gray-800">New Transaction</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label>
                <input value={customer} onChange={e => setCustomer(e.target.value)} className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 ring-blue-100 bg-gray-50 focus:bg-white" placeholder="Enter Name" />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 ring-blue-100 bg-gray-50 focus:bg-white" />
            </div>
        </div>

        {/* Product Selection */}
        <div className="mb-6">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block tracking-wider">Select Product Color</label>
            <div className="flex flex-wrap gap-4">
                {products.length === 0 ? <p className="text-gray-400 text-sm italic">No products in inventory.</p> : products.map(p => (
                    <button 
                        key={p._id}
                        onClick={() => { setSelectedProduct(p); setQty(1); }}
                        disabled={p.stockCount <= 0}
                        className={`relative group flex flex-col items-center gap-1 transition-transform active:scale-95
                            ${p.stockCount <= 0 ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}
                        `}
                    >
                        <div className="w-14 h-14 rounded-full shadow-md flex items-center justify-center border-2 border-white ring-1 ring-gray-200" style={{ backgroundColor: getColor(p.colorName) }}>
                            <span className="text-[10px] text-white font-bold drop-shadow-md">{(p.unitPrice/1000).toFixed(1)}k</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600 capitalize">{p.colorName}</span>
                        <span className={`absolute -top-1 -right-1 text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold shadow-sm ${p.stockCount > 0 ? 'bg-gray-800' : 'bg-red-500'}`}>{p.stockCount}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Selection Panel */}
        <div className={`transition-all duration-300 overflow-hidden ${selectedProduct ? 'max-h-40 opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'}`}>
            {selectedProduct && (
                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border shadow-sm" style={{ backgroundColor: getColor(selectedProduct.colorName) }}></div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg capitalize">{selectedProduct.colorName}</h3>
                            <p className="text-xs text-blue-600 font-bold">Available: {selectedProduct.stockCount}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 hover:bg-gray-100 text-gray-600 font-bold">-</button>
                            <input type="number" value={qty} readOnly className="w-12 text-center font-bold text-gray-800 outline-none" />
                            <button onClick={() => setQty(Math.min(selectedProduct.stockCount, qty + 1))} className="px-4 py-2 hover:bg-gray-100 text-gray-600 font-bold">+</button>
                        </div>
                        <button onClick={addToCart} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md shadow-blue-200 transition-all flex-1 md:flex-none">Add to Bill</button>
                    </div>
                </div>
            )}
        </div>

        {/* Bill Items */}
        <div className="border-t pt-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Bill Items</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-400 text-sm border border-dashed border-gray-200">No items added yet.</div>
                ) : (
                    cart.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(item.colorName) }}></div>
                                <span className="font-bold text-gray-700 capitalize">{item.colorName} <span className="text-gray-400 text-xs ml-1">x {item.qty}</span></span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-gray-800">Rs. {(item.price * item.qty).toLocaleString()}</span>
                                <button onClick={() => removeFromCart(index)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* --- RIGHT SIDE (PAYMENT) --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:sticky lg:top-4">
        <h3 className="text-lg font-bold mb-6 text-gray-800">Payment Summary</h3>
        
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <span className="text-gray-500 font-bold">Total Amount</span>
                <span className="text-2xl font-black text-gray-800">Rs. {total.toLocaleString()}</span>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="text-xs text-blue-600 font-bold uppercase mb-1 block">Amount Paid (Rs)</label>
                <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full bg-white border border-blue-200 p-3 rounded-lg text-right font-bold text-xl outline-none focus:ring-2 ring-blue-400 text-gray-800" placeholder="0" />
            </div>

            {/* ✅ Note Input Area */}
            <div>
                <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Note (Optional)</label>
                <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    className="w-full border border-gray-200 p-3 rounded-lg text-sm outline-none focus:ring-2 ring-gray-200 bg-gray-50 focus:bg-white resize-none" 
                    placeholder="Add a short note..." 
                    rows="2"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Balance Due</span>
                    <span className={`text-lg font-bold ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>Rs. {balance > 0 ? balance.toLocaleString() : 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${balance <= 0 ? 'bg-green-100 text-green-700' : (parseFloat(paidAmount)>0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}`}>
                        {balance <= 0 ? 'Paid' : (parseFloat(paidAmount)>0 ? 'Partial' : 'Credit')}
                    </span>
                </div>
            </div>

            <button onClick={handleCheckout} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4">
                <Save size={20}/> Complete Sale
            </button>
        </div>
      </div>

    </div>
  );
};

export default SalesPOS;