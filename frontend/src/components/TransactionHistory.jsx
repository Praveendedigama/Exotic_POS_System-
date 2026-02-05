import React, { useState } from 'react';
import axios from 'axios';
import { Filter, Trash2, FileText, Info, Wallet, X, CheckCircle, Edit3, Calendar } from 'lucide-react';

const TransactionHistory = ({ sales, fetchData, API_URL, role }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showBin, setShowBin] = useState(false); 

  // --- MODALS STATE ---
  const [isRepayModalOpen, setRepayModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false); // Note & History Modal
  
  const [selectedSale, setSelectedSale] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [noteText, setNoteText] = useState(''); // Note Edit කරන්න

  // Filter Logic
  const filteredSales = sales.filter(sale => {
    if (showBin) {
        if (!sale.isDeleted) return false;
    } else {
        if (sale.isDeleted || sale.isArchived) return false; 
    }
    if (role !== 'admin') {
        const saleDate = new Date(sale.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0); 
        saleDate.setHours(0, 0, 0, 0);
        if (saleDate < sevenDaysAgo) return false;
    }
    const saleDate = new Date(sale.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const dateMatch = (!start || saleDate >= start) && (!end || saleDate <= end);
    const statusMatch = filterStatus === 'All' || sale.status === filterStatus;
    return dateMatch && statusMatch;
  });

  const handleDelete = async (id) => {
      if(confirm("Move to Recycle Bin?")) {
          try {
              await axios.put(`${API_URL}/transactions/${id}/delete`);
              fetchData(); 
          } catch (error) { alert("Delete Failed"); }
      }
  };

  // Open Payment Modal
  const openRepayModal = (sale) => {
    setSelectedSale(sale);
    setRepayAmount('');
    setRepayModalOpen(true);
  };

  // ✅ Open Details/Edit Note Modal
  const openDetailsModal = (sale) => {
    setSelectedSale(sale);
    setNoteText(sale.note || ""); // තිබ්බ Note එක ගන්න, නැත්නම් හිස් කරන්න
    setDetailsModalOpen(true);
  };

  // ✅ Submit Payment
  const handleRepaySubmit = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) return alert("Enter valid amount");
    const balance = selectedSale.totalAmount - selectedSale.paidAmount;
    if (parseFloat(repayAmount) > balance) return alert(`Cannot pay more than due amount (Rs. ${balance})`);
    try {
        await axios.put(`${API_URL}/transactions/${selectedSale._id}/repay`, { amount: parseFloat(repayAmount) });
        alert("Payment Updated! ✅");
        setRepayModalOpen(false);
        fetchData(); 
    } catch (error) { alert("Update Failed"); }
  };

  // ✅ Save Edited Note
  const handleSaveNote = async () => {
    try {
        await axios.put(`${API_URL}/transactions/${selectedSale._id}/note`, { note: noteText });
        alert("Note Updated! 📝");
        setDetailsModalOpen(false);
        fetchData();
    } catch (error) { alert("Failed to update note"); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
       
       {/* --- 1. DETAILS & NOTE EDIT MODAL --- */}
       {isDetailsModalOpen && selectedSale && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animation-fade-in relative">
                <button onClick={() => setDetailsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                
                <h3 className="text-xl font-bold text-gray-800 mb-1">Transaction Details</h3>
                <p className="text-sm text-gray-500 mb-4">Customer: <span className="font-semibold">{selectedSale.customerName}</span></p>
                
                {/* Editable Note Section */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Note (Edit)</label>
                    <textarea 
                        className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl text-sm focus:ring-2 ring-blue-500 outline-none"
                        rows="3"
                        placeholder="Add a note here..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                    />
                    <button onClick={handleSaveNote} className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                        Save Note
                    </button>
                </div>

                {/* Repayment History Section */}
                <div className="border-t pt-4">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                        <Calendar size={16} className="text-green-600"/> Payment History
                    </h4>
                    
                    <div className="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto">
                        {/* Initial Payment Display */}
                        {selectedSale.paidAmount > 0 && (!selectedSale.repaymentHistory || selectedSale.repaymentHistory.length === 0) && (
                             <div className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                <span className="text-gray-500">{selectedSale.date} (Initial)</span>
                                <span className="font-bold text-green-700">+ Rs. {selectedSale.paidAmount}</span>
                             </div>
                        )}

                        {/* Repayment List */}
                        {selectedSale.repaymentHistory && selectedSale.repaymentHistory.map((rec, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-200 last:border-0">
                                <span className="text-gray-500 font-medium">{rec.date}</span>
                                <span className="font-bold text-green-700">+ Rs. {rec.amount.toLocaleString()}</span>
                            </div>
                        ))}

                        {/* No history fallback */}
                        {selectedSale.paidAmount === 0 && (!selectedSale.repaymentHistory || selectedSale.repaymentHistory.length === 0) && (
                            <p className="text-xs text-gray-400 text-center italic">No payments made yet.</p>
                        )}
                    </div>
                </div>
            </div>
         </div>
       )}

       {/* --- 2. REPAYMENT MODAL --- */}
       {isRepayModalOpen && selectedSale && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animation-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Add Payment</h3>
                    <button onClick={() => setRepayModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl mb-4">
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Total:</span><span className="font-bold">Rs. {selectedSale.totalAmount}</span></div>
                    <div className="flex justify-between text-lg font-bold text-red-500 border-t border-blue-100 pt-2 mt-2"><span>Balance Due:</span><span>Rs. {selectedSale.totalAmount - selectedSale.paidAmount}</span></div>
                </div>
                <input type="number" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} className="w-full border p-3 rounded-lg text-lg font-bold outline-none focus:ring-2 ring-blue-500 mb-4" placeholder="Amount (Rs)" autoFocus />
                <button onClick={handleRepaySubmit} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle size={18}/> Confirm Payment</button>
            </div>
         </div>
       )}

       {/* --- HEADER & FILTERS --- */}
       <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800">{showBin ? 'Recycle Bin 🗑️' : 'Transaction History'}</h3>
                <button onClick={() => setShowBin(!showBin)} className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 font-bold transition-colors ${showBin ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'}`}>
                    {showBin ? <><FileText size={12}/> View Active</> : <><Trash2 size={12}/> Recycle Bin</>}
                </button>
              </div>
              {/* {role !== 'admin' && !showBin && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit"><Info size={12}/><span>Limited View: Last 7 days</span></div>
              )} */}
          </div>
          
          {!showBin && (
              <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-lg w-full md:w-auto">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border p-1 rounded w-28" />
                <span className="text-gray-400">-</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border p-1 rounded w-28" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border p-1 rounded"><option value="All">All</option><option value="Paid">Paid</option><option value="Credit">Credit</option><option value="Partial">Partial</option></select>
                <button onClick={() => {setStartDate(''); setEndDate(''); setFilterStatus('All')}} className="text-xs text-blue-600 hover:underline">Clear</button>
              </div>
          )}
       </div>

       {/* --- TABLE --- */}
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
              {!showBin && <th className="p-4 text-center">Actions</th>} 
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredSales.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">No records found.</td></tr>
            ) : (
              filteredSales.map((sale) => {
                  const balance = sale.totalAmount - (sale.paidAmount || 0);
                  return (
                  <tr key={sale._id} className={`border-b hover:bg-gray-50 ${sale.isDeleted ? 'bg-red-50' : ''}`}>
                      <td className="p-4 text-gray-600">{sale.date}</td>
                      <td className="p-4 font-medium">{sale.customerName}</td>
                      <td className="p-4 text-gray-600 max-w-xs truncate" title={sale.items.map(i => `${i.colorName} x${i.quantity || i.qty}`).join(', ')}>{sale.items.map(i => `${i.colorName} x${i.quantity || i.qty}`).join(', ')}</td>
                      <td className="p-4 font-bold">Rs. {sale.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-green-600">Rs. {(sale.paidAmount || 0).toLocaleString()}</td>
                      <td className="p-4 text-red-500 font-semibold">{balance > 0 ? `Rs. ${balance.toLocaleString()}` : '-'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sale.status === 'Paid' ? 'bg-green-100 text-green-700' : sale.status === 'Credit' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{sale.status}</span>
                      </td>
                      
                      {!showBin && (
                          <td className="p-4 flex gap-2 justify-center items-center">
                              {/* ✅ EDIT / DETAILS BUTTON (This opens Note & History) */}
                              <button 
                                onClick={() => openDetailsModal(sale)} 
                                className={`p-2 rounded-lg transition-colors border flex items-center gap-1
                                    ${sale.note ? 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                title="View Details / Edit Note"
                              >
                                  <Edit3 size={16}/>
                              </button>

                              {/* PAY BUTTON */}
                              {balance > 0 && (
                                <button onClick={() => openRepayModal(sale)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 flex items-center gap-1" title="Add Payment">
                                    <Wallet size={16}/> <span className="text-xs font-bold">Pay</span>
                                </button>
                              )}

                              {/* DELETE BUTTON */}
                              {role === 'admin' && (
                                  <button onClick={() => handleDelete(sale._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
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