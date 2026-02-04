import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, ShoppingCart, Package, Plus, Trash2, Save, TrendingUp, RefreshCcw, FileText, Filter, Edit, Circle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = 'https://exotic-pos-system.onrender.com/api';

// --- COLOR HELPER FUNCTION ---
// නම අනුව පාට තීරණය කරන තැන
const getColor = (name) => {
  const n = name.toLowerCase();
  if (n.includes('blue') || n.includes('white')) return '#3b82f6'; // White/Blue -> Blue Color
  if (n.includes('red')) return '#ef4444';    // Red -> Red Color
  if (n.includes('yellow')) return '#eab308'; // Yellow -> Yellow Color
  if (n.includes('green')) return '#22c55e';  // Green -> Green Color
  return '#94a3b8'; // Default Gray
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await axios.get(`${API_URL}/products`);
      const sRes = await axios.get(`${API_URL}/sales`);
      setProducts(pRes.data);
      setSales(sRes.data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

// --- UPDATED DASHBOARD COMPONENT ---
  const Dashboard = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalStock = products.reduce((sum, p) => sum + p.stockCount, 0);

// Pie Chart Data Logic (Updated Fix)
    const pieDataMap = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const colorName = item.colorName || 'Unknown';
        // [FIX] parseInt දාපු නිසා පරණ string data තිබ්බත් අවුලක් යන්නේ නෑ
        const qty = parseInt(item.quantity) || 0; 
        
        pieDataMap[colorName] = (pieDataMap[colorName] || 0) + qty;
      });
    });
    
    const pieChartData = Object.keys(pieDataMap).map(key => ({ name: key, value: pieDataMap[key] }));

    // Custom Tooltip for Pie Chart
    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
            <p className="font-bold text-gray-700">{payload[0].name}</p>
            <p className="text-blue-600 font-medium">Sold: {payload[0].value} Items</p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
             <div><p className="text-gray-500 text-sm">Total Revenue</p><h3 className="text-2xl font-bold text-gray-800">Rs. {totalRevenue.toLocaleString()}</h3></div>
             <div className="p-3 bg-green-100 rounded-full text-green-600"><TrendingUp size={24} /></div>
          </div>
          
          {/* Stock with COLORED DOTS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <div><p className="text-gray-500 text-sm">Total Stock Items</p><h3 className="text-2xl font-bold text-gray-800">{totalStock} units</h3></div>
              <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Package size={24} /></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
               {products.map(p => (
                 <div key={p._id} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: getColor(p.colorName) }}></div>
                     <span className="text-gray-600 font-medium">{p.colorName}</span>
                   </div>
                   <span className="font-bold text-gray-800">{p.stockCount}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
             <div><p className="text-gray-500 text-sm">Total Transactions</p><h3 className="text-2xl font-bold text-gray-800">{sales.length}</h3></div>
             <div className="p-3 bg-purple-100 rounded-full text-purple-600"><ShoppingCart size={24} /></div>
          </div>
        </div>

        {/* IMPROVED PIE CHART */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
           <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Sales Distribution by Color</h3>
           <div className="h-72 w-full flex justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={pieChartData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={5} 
                    dataKey="value"
                    stroke="none"
                 >
                   {pieChartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                   ))}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
                 <Legend verticalAlign="bottom" height={36} iconType="circle"/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    );
  };

  // --- TRANSACTIONS (With Filters) ---
  const TransactionHistory = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Filtering Logic
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const dateMatch = (!start || saleDate >= start) && (!end || saleDate <= end);
      const statusMatch = filterStatus === 'All' || sale.status === filterStatus;
      
      return dateMatch && statusMatch;
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Transaction History</h3>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-lg">
               <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Filter size={12}/> Filter:</span>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border p-1 rounded" />
               <span className="text-gray-400">-</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border p-1 rounded" />
               <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border p-1 rounded">
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Credit">Credit</option>
                  <option value="Partial">Partial</option>
               </select>
               <button onClick={() => {setStartDate(''); setEndDate(''); setFilterStatus('All')}} className="text-xs text-blue-600 hover:underline">Clear</button>
            </div>
         </div>
         <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-sm uppercase text-gray-500">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Balance</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredSales.map((sale) => {
                const balance = sale.totalAmount - (sale.paidAmount || 0); // Handle old data
                return (
                  <tr key={sale._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-gray-600">{sale.date}</td>
                    <td className="p-4 font-medium">{sale.customerName}</td>
                    <td className="p-4 text-gray-600">{sale.items.map(i => `${i.colorName} x${i.quantity}`).join(', ')}</td>
                    <td className="p-4 font-bold">Rs. {sale.totalAmount.toLocaleString()}</td>
                    <td className="p-4 text-green-600">Rs. {(sale.paidAmount || 0).toLocaleString()}</td>
                    <td className="p-4 text-red-500 font-semibold">{balance > 0 ? `Rs. ${balance.toLocaleString()}` : '-'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                        ${sale.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                          sale.status === 'Credit' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- SALES POS (With Partial Payments) ---
  const SalesPOS = () => {
    const [customer, setCustomer] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cart, setCart] = useState([{ productId: '', qty: 1, price: 0 }]);
    const [paidAmount, setPaidAmount] = useState('');

 const updateCart = (idx, field, val) => {
    const nc = [...cart];
    if (field === 'productId') {
      const p = products.find(x => x._id === val);
      nc[idx].productId = val;
      nc[idx].price = p ? p.unitPrice : 0;
    } else if (field === 'qty') {
      // [FIX] ඉලක්කමක් බවට පරිවර්තනය කිරීම
      nc[idx][field] = parseInt(val) || 1; 
    } else {
      nc[idx][field] = val;
    }
    setCart(nc);
  };

    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const balance = total - (parseFloat(paidAmount) || 0);

    const handleCheckout = async () => {
        if (!customer) return alert("Customer Name Required");
        
        const paid = parseFloat(paidAmount) || 0;
        let status = 'Paid';
        if (paid === 0) status = 'Credit';
        else if (paid < total) status = 'Partial';

        const payload = {
            customerName: customer, date, status, totalAmount: total, paidAmount: paid,
            items: cart.map(i => {
                const p = products.find(x => x._id === i.productId);
                return { productId: i.productId, colorName: p?.colorName, quantity: i.qty, price: i.price };
            })
        };

        await axios.post(`${API_URL}/transactions`, payload);
        alert("Sale Recorded! ✅");
        setCart([{ productId: '', qty: 1, price: 0 }]); setCustomer(''); setPaidAmount(''); fetchData();
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h2 className="text-xl font-bold mb-4">New Transaction</h2>
           <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Customer Name" value={customer} onChange={e=>setCustomer(e.target.value)} className="border p-2 rounded" />
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border p-2 rounded" />
           </div>
           {/* Cart Items */}
           <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {cart.map((item, i) => (
                 <div key={i} className="flex gap-2">
                    <select className="border p-2 flex-1 rounded" value={item.productId} onChange={e=>updateCart(i,'productId',e.target.value)}>
                       <option value="">Select Product</option>
                       {products.map(p => <option key={p._id} value={p._id}>{p.colorName}</option>)}
                    </select>
                    <input type="number" className="border p-2 w-20 rounded" value={item.qty} min="1" onChange={e=>updateCart(i,'qty',e.target.value)} />
                    <input type="text" readOnly className="border p-2 w-32 bg-gray-200 rounded font-bold" value={item.price} />
                    <button onClick={()=>setCart(cart.filter((_,idx)=>idx!==i))} className="text-red-500"><Trash2 size={18}/></button>
                 </div>
              ))}
              <button onClick={()=>setCart([...cart,{productId:'',qty:1,price:0}])} className="text-blue-600 text-sm font-bold flex items-center gap-1 mt-2"><Plus size={16}/> Add Item</button>
           </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
           <h3 className="text-lg font-bold mb-4">Payment Details</h3>
           <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xl font-bold"><span>Total:</span><span>Rs. {total.toLocaleString()}</span></div>
              <div>
                 <label className="text-sm text-gray-600 block mb-1">Amount Paid (Rs)</label>
                 <input type="number" value={paidAmount} onChange={e=>setPaidAmount(e.target.value)} className="w-full border p-2 rounded focus:ring-2 ring-blue-500 font-bold text-green-700" placeholder="0" />
              </div>
              <div className="flex justify-between text-lg font-semibold text-red-600 pt-2 border-t">
                 <span>Balance / Due:</span><span>Rs. {balance > 0 ? balance.toLocaleString() : 0}</span>
              </div>
              <div className="text-sm text-gray-500 text-right">Status: <span className="font-bold uppercase">{balance <= 0 ? 'Paid' : (parseFloat(paidAmount)>0 ? 'Partial' : 'Credit')}</span></div>
           </div>
           <button onClick={handleCheckout} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg">Complete Sale</button>
        </div>
      </div>
    );
  };

  // --- INVENTORY (With Edit/Delete) ---
  const Inventory = () => {
    const [form, setForm] = useState({ id: null, colorName: '', unitWeight: '', unitPrice: '', stockCount: '' });

    const handleSave = async () => {
       if (form.id) { // Edit
          await axios.put(`${API_URL}/products/${form.id}`, form);
       } else { // Create
          await axios.post(`${API_URL}/products`, form);
       }
       setForm({ id: null, colorName: '', unitWeight: '', unitPrice: '', stockCount: '' });
       fetchData();
       alert(form.id ? "Updated! ✅" : "Added! ✅");
    };

    const handleDelete = async (id) => {
       if(confirm("Are you sure you want to delete this product?")) {
          await axios.delete(`${API_URL}/products/${id}`);
          fetchData();
       }
    };

    const handleReset = async () => {
        if(confirm("⚠️ අනතුරු ඇඟවීමයි!\n\nසියලුම දත්ත (Products සහ Transactions) මැකී යනු ඇත.\nඔබට විශ්වාසද?")) {
            try {
                await axios.post(`${API_URL}/reset`);
                alert("System Reset Successful! 🗑️");
                fetchData(); // Screen එක refresh කරන්න
            } catch (error) {
                alert("Reset Failed");
            }
        }
    };

    const handleEdit = (p) => {
       setForm({ id: p._id, colorName: p.colorName, unitWeight: p.unitWeight, unitPrice: p.unitPrice, stockCount: p.stockCount });
    };

    return (
        <div className="space-y-6">
          {/* [NEW] RESET BUTTON SECTION */}
          <div className="flex justify-end">
              <button onClick={handleReset} className="text-red-500 text-xs hover:bg-red-50 px-3 py-1 rounded border border-red-200 flex items-center gap-1">
                  <Trash2 size={14}/> Factory Reset System
              </button>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold mb-4">{form.id ? 'Edit Product' : 'Add New Product'}</h3>
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div><label className="text-xs text-gray-500">Color</label><input className="w-full border p-2 rounded" value={form.colorName} onChange={e=>setForm({...form, colorName:e.target.value})} placeholder="Ex: Blue" /></div>
                <div><label className="text-xs text-gray-500">Weight</label><input className="w-full border p-2 rounded" type="number" value={form.unitWeight} onChange={e=>setForm({...form, unitWeight:e.target.value})} /></div>
                <div><label className="text-xs text-gray-500">Price</label><input className="w-full border p-2 rounded" type="number" value={form.unitPrice} onChange={e=>setForm({...form, unitPrice:e.target.value})} /></div>
                <div><label className="text-xs text-gray-500">Stock</label><input className="w-full border p-2 rounded" type="number" value={form.unitCount} onChange={e=>setForm({...form, stockCount:e.target.value})} /></div>
                <div className="flex gap-2">
                   <button onClick={handleSave} className="bg-green-600 text-white p-2 rounded w-full flex justify-center items-center gap-1"><Save size={16}/> {form.id ? 'Update' : 'Add'}</button>
                   {form.id && <button onClick={()=>setForm({id:null, colorName:'', unitWeight:'', unitPrice:'', stockCount:''})} className="bg-gray-500 text-white p-2 rounded">Cancel</button>}
                </div>
             </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-sm uppercase text-gray-500">
                   <tr><th className="p-4">Color</th><th className="p-4">Weight</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Actions</th></tr>
                </thead>
                <tbody>
                   {products.map(p => (
                      <tr key={p._id} className="border-b hover:bg-gray-50">
                         <td className="p-4 flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border" style={{backgroundColor: getColor(p.colorName)}}></div>
                            <span className="font-medium">{p.colorName}</span>
                         </td>
                         <td className="p-4">{p.unitWeight}g</td>
                         <td className="p-4">Rs. {p.unitPrice}</td>
                         <td className="p-4">{p.stockCount}</td>
                         <td className="p-4 flex gap-2">
                            <button onClick={()=>handleEdit(p)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit size={16}/></button>
                            <button onClick={()=>handleDelete(p._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
       <div className="w-64 bg-slate-900 text-white p-5 flex flex-col">
          <h1 className="text-2xl font-bold mb-10 text-center tracking-wider">Exotic <span className="text-blue-400">POS</span></h1>
          <nav className="flex-1 space-y-2">
             <button onClick={()=>setActiveTab('dashboard')} className={`w-full flex gap-3 p-3 rounded-lg ${activeTab==='dashboard'?'bg-blue-600':'hover:bg-slate-800'}`}><LayoutDashboard size={20}/> Dashboard</button>
             <button onClick={()=>setActiveTab('sales')} className={`w-full flex gap-3 p-3 rounded-lg ${activeTab==='sales'?'bg-blue-600':'hover:bg-slate-800'}`}><ShoppingCart size={20}/> Sales / POS</button>
             <button onClick={()=>setActiveTab('transactions')} className={`w-full flex gap-3 p-3 rounded-lg ${activeTab==='transactions'?'bg-blue-600':'hover:bg-slate-800'}`}><FileText size={20}/> Transactions</button>
             <button onClick={()=>setActiveTab('inventory')} className={`w-full flex gap-3 p-3 rounded-lg ${activeTab==='inventory'?'bg-blue-600':'hover:bg-slate-800'}`}><Package size={20}/> Inventory</button>
          </nav>
       </div>
       <div className="flex-1 p-8 overflow-y-auto">
          <header className="flex justify-between mb-8">
             <div className="flex items-center gap-4"><h2 className="text-2xl font-bold capitalize">{activeTab} Overview</h2><button onClick={fetchData} className="p-2 bg-white rounded-full shadow text-blue-600"><RefreshCcw size={18}/></button></div>
             <div className="text-sm text-gray-500">{new Date().toDateString()}</div>
          </header>
          {loading ? <div className="text-center py-20 text-gray-500">Loading...</div> : (
             <>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'sales' && <SalesPOS />}
                {activeTab === 'transactions' && <TransactionHistory />}
                {activeTab === 'inventory' && <Inventory />}
             </>
          )}
       </div>
    </div>
  );
};

export default App;