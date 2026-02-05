// src/components/TransactionHistory.jsx
import React, { useState } from 'react';
import { Filter, Trash2, FileText, Info } from 'lucide-react';

// [UPDATE] role prop එක මෙතනට එකතු කළා
const TransactionHistory = ({ sales, fetchData, API_URL, role }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showBin, setShowBin] = useState(false); 

  const filteredSales = sales.filter(sale => {
    // 1. Recycle Bin Logic
    if (showBin) {
        if (!sale.isDeleted) return false;
    } else {
        if (sale.isDeleted || sale.isArchived) return false; 
    }

    // [NEW] 📅 7 DAYS RESTRICTION FOR STAFF & MANAGER
    // Admin නොවන ඕනෑම කෙනෙක්ට (Staff/Manager) දින 7ක සීමාව දානවා
    if (role !== 'admin') {
        const saleDate = new Date(sale.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        // වෙලාවන් (Time) ප්‍රශ්නයක් නොවෙන්න දිනේ මුලටම සෙට් කරනවා
        sevenDaysAgo.setHours(0, 0, 0, 0); 
        saleDate.setHours(0, 0, 0, 0);

        // දවස් 7ට වඩා පරණයි නම් පෙන්නන්න එපා
        if (saleDate < sevenDaysAgo) return false;
    }

    // 2. Date & Status Filter (User Manual Filters)
    const saleDate = new Date(sale.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const dateMatch = (!start || saleDate >= start) && (!end || saleDate <= end);
    const statusMatch = filterStatus === 'All' || sale.status === filterStatus;
    
    return dateMatch && statusMatch;
  });

  const handleDelete = async (id) => {
      if(confirm("Are you sure you want to delete this transaction? (It will move to Recycle Bin)")) {
          try {
              await fetch(`${API_URL}/transactions/${id}/delete`, { method: 'PUT' });
              fetchData(); 
          } catch (error) {
              alert("Delete Failed");
          }
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
       <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800">
                    {showBin ? 'Recycle Bin 🗑️' : 'Transaction History'}
                </h3>
                
                <button 
                    onClick={() => setShowBin(!showBin)}
                    className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 font-bold transition-colors
                    ${showBin ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'}`}
                >
                    {showBin ? <><FileText size={12}/> View Active</> : <><Trash2 size={12}/> Recycle Bin</>}
                </button>
              </div>

              {/* [NEW] පණිවිඩය: Staff/Manager අයට පේනවා සීමා කර ඇති බව */}
              {/* {role !== 'admin' && !showBin && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                      <Info size={12}/>
                      <span>Limited View: Showing last 7 days only</span>
                  </div>
              )} */}
          </div>
          
          {!showBin && (
              <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-lg w-full md:w-auto">
              <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Filter size={12}/> Filter:</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border p-1 rounded w-28" />
              <span className="text-gray-400">-</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border p-1 rounded w-28" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border p-1 rounded">
                  <option value="All">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Credit">Credit</option>
                  <option value="Partial">Partial</option>
              </select>
              <button onClick={() => {setStartDate(''); setEndDate(''); setFilterStatus('All')}} className="text-xs text-blue-600 hover:underline">Clear</button>
              </div>
          )}
       </div>
       <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b text-sm uppercase text-gray-500">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Items</th>
              <th className="p-4">Total</th>
              <th className="p-4">Paid</th>
              <th className="p-4">Balance</th>
              <th className="p-4">Status</th>
              {!showBin && <th className="p-4">Action</th>} 
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredSales.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">No records found {role !== 'admin' ? '(in last 7 days)' : ''}.</td></tr>
            ) : (
              filteredSales.map((sale) => {
                  const balance = sale.totalAmount - (sale.paidAmount || 0);
                  return (
                  <tr key={sale._id} className={`border-b hover:bg-gray-50 ${sale.isDeleted ? 'bg-red-50' : ''}`}>
                      <td className="p-4 text-gray-600">{sale.date}</td>
                      <td className="p-4 font-medium">{sale.customerName}</td>
                      <td className="p-4 text-gray-600">{sale.items.map(i => `${i.colorName} x${i.quantity || i.qty}`).join(', ')}</td>
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
                      {!showBin && (
                          <td className="p-4">
                              {/* Delete Button එක Admin/Manager ට විතරක් දෙමු (Safety First) */}
                              {role === 'admin' ? (
                                  <button 
                                      onClick={() => handleDelete(sale._id)}
                                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                      title="Move to Recycle Bin"
                                  >
                                      <Trash2 size={16}/>
                                  </button>
                              ) : (
                                <span className="text-gray-300 text-xs italic">Read-only</span>
                              )}
                          </td>
                      )}
                  </tr>
                  );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;