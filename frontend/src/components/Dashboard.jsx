import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Package } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// const API_URL = 'http://localhost:5000/api';

const getColor = (name) => {
  const n = name.toLowerCase();
  if (n.includes('blue') || n.includes('white')) return '#3b82f6';
  if (n.includes('red')) return '#ef4444';
  if (n.includes('yellow')) return '#eab308';
  if (n.includes('green')) return '#22c55e';
  if (n.includes('black')) return '#1f2937';
  if (n.includes('purple')) return '#9333ea';
  return '#94a3b8';
};

const Dashboard = ({ sales, products, fetchData, API_URL }) => {
  // [LOGIC] Active Sales විතරක් ගන්න
  const activeSales = sales.filter(sale => !sale.isDeleted && !sale.isArchived);
  
  // Batch History Data
  const [batches, setBatches] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch Batches
  const fetchBatches = async () => {
    try {
      const res = await axios.get(`${API_URL}/batches`);
      setBatches(res.data);
    } catch (error) { 
      console.error("Batch Error", error); 
    }
  };

  useEffect(() => { 
    fetchBatches(); 
  }, [sales]); 

  // --- CALCULATIONS ---
  let totalSalesVal = 0;
  let totalCollected = 0;
  let totalDue = 0;

  activeSales.forEach(sale => {
    const total = sale.totalAmount || 0;
    const paid = sale.paidAmount !== undefined ? sale.paidAmount : (sale.status === 'Paid' ? total : 0);
    totalSalesVal += total;
    totalCollected += paid;
    totalDue += (total - paid);
  });

  const totalStock = products.reduce((sum, p) => sum + p.stockCount, 0);

  // Pie Chart Logic
  const pieDataMap = {};
  activeSales.forEach(sale => {
    sale.items.forEach(item => {
      const colorName = item.colorName || 'Unknown';
      const qty = parseInt(item.quantity) || 0; 
      pieDataMap[colorName] = (pieDataMap[colorName] || 0) + qty;
    });
  });
  const pieChartData = Object.keys(pieDataMap).map(key => ({ name: key, value: pieDataMap[key] }));
  
  const CustomTooltip = ({ active, payload }) => { 
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
          <p className="font-bold text-gray-700">{payload[0].name}</p>
          <p className="text-blue-600 font-medium">Sold: {payload[0].value}</p>
        </div>
      );
    } 
    return null;
  };

  // --- HANDLER: END BATCH ---
  const handleEndBatch = async () => {
    if (activeSales.length === 0) return alert("No active sales to archive!");
    if (confirm("⚠️ Are you sure you want to END this batch?\n\nThis will:\n1. Move all current sales to 'History'\n2. Reset Revenue to 0\n3. Start a fresh dashboard")) {
      try {
        await axios.post(`${API_URL}/batches/end`);
        alert("Batch Ended Successfully! 🎉");
        fetchData(); 
        fetchBatches();
      } catch (error) {
        alert("Failed to end batch");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Current Batch Overview</h3>
          <p className="text-xs text-gray-500">Live data since last reset</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center gap-2"
          >
            {showHistory ? 'Hide History' : '📜 View Past Batches'}
          </button>
          <button 
            onClick={handleEndBatch} 
            className="px-4 py-2 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 flex items-center gap-2"
          >
            🏁 End Batch & Reset
          </button>
        </div>
      </div>

      {/* --- HISTORY VIEW (SCROLLABLE TABLE) --- */}
      {showHistory && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animation-fade-in mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">📦 Batch History (Past Records)</h3>
          
          {/* 👇 SCROLLABLE CONTAINER (max-h-96 added) */}
          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-100 rounded-lg">
            <table className="w-full text-left text-sm relative">
              {/* 👇 STICKY HEADER (sticky top-0 z-10 added) */}
              <thead className="bg-gray-100 text-gray-600 uppercase sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 bg-gray-100">Batch Name</th>
                  <th className="p-3 bg-gray-100">Period</th>
                  <th className="p-3 bg-gray-100">Item Breakdown</th>
                  <th className="p-3 bg-gray-100">Customer Debts</th>
                  <th className="p-3 bg-gray-100 text-right">Total Sales</th>
                  <th className="p-3 bg-gray-100 text-right">Collected</th>
                  <th className="p-3 bg-gray-100 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.length === 0 ? 
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">No past batches found.</td></tr> : 
                  batches.map(b => (
                    <tr key={b._id} className="hover:bg-blue-50/50 transition-colors align-top">
                      <td className="p-3 font-bold text-gray-700">{b.batchName}</td>
                      <td className="p-3 text-gray-500 text-xs">
                        <div className="font-mono">{b.startDate}</div>
                        <div className="text-[10px] text-gray-400">to {b.endDate}</div>
                      </td>
                      
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {b.itemsSummary && Object.entries(b.itemsSummary).map(([color, qty]) => (
                            <span key={color} className="text-[10px] px-1.5 py-0.5 rounded border bg-white border-gray-200 text-gray-600 shadow-sm">
                              {color}: <b>{qty}</b>
                            </span>
                          ))}
                          {(!b.itemsSummary || Object.keys(b.itemsSummary).length === 0) && <span className="text-gray-400 text-xs">-</span>}
                        </div>
                      </td>

                      <td className="p-3">
                        {b.customerDebts && b.customerDebts.length > 0 ? (
                          <div className="space-y-1 max-w-xs">
                            {b.customerDebts.map((debt, idx) => (
                              <div key={idx} className="text-[11px] bg-red-50 border border-red-100 px-2 py-1 rounded">
                                <div className="font-bold text-gray-700">{debt.customerName}</div>
                                <div className="text-red-600 font-semibold">Owes: Rs. {debt.balance.toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600 text-xs font-semibold">✓ All Paid</span>
                        )}
                      </td>

                      <td className="p-3 text-right font-bold text-gray-800">Rs. {b.totalSales.toLocaleString()}</td>
                      <td className="p-3 text-right text-green-600 font-medium">Rs. {b.totalCollected.toLocaleString()}</td>
                      <td className="p-3 text-right text-red-500 font-medium">Rs. {b.totalDue.toLocaleString()}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- ACTIVE STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Current Sales</p>
          <h3 className="text-2xl font-bold text-gray-800">Rs. {totalSalesVal.toLocaleString()}</h3>
          <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded">Active Batch</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Cash In Hand</p>
          <h3 className="text-2xl font-bold text-green-600">Rs. {totalCollected.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">To Be Collected</p>
          <h3 className="text-2xl font-bold text-red-500">Rs. {totalDue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Transactions</p>
            <h3 className="text-2xl font-bold text-gray-800">{activeSales.length}</h3>
          </div>
          <div className="p-3 bg-purple-100 rounded-full text-purple-600"><ShoppingCart size={24} /></div>
        </div>
      </div>

      {/* --- CHARTS (Stock & Pie) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-500 text-sm">Total Stock Items</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalStock} units</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Package size={24} /></div>
          </div>
          <div className="pt-4 border-t border-gray-100 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {products.map(p => (
              <div key={p._id} className="flex items-center justify-between text-sm hover:bg-gray-50 p-1 rounded transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: getColor(p.colorName) }}></div>
                  <span className="text-gray-600 font-medium">{p.colorName}</span>
                </div>
                <span className={`font-bold ${p.stockCount < 5 ? 'text-red-500' : 'text-gray-800'}`}>{p.stockCount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">Sales Distribution (Current Batch)</h3>
          <div className="h-64 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={getColor(entry.name)} />))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;