import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Save, Edit, Lock, RefreshCcw } from 'lucide-react';

const getColor = (name) => {
  const n = name?.toLowerCase() || '';
  if (n.includes('blue') || n.includes('white')) return '#3b82f6';
  if (n.includes('red')) return '#ef4444';
  if (n.includes('yellow')) return '#eab308';
  if (n.includes('green')) return '#22c55e';
  if (n.includes('black')) return '#1f2937';
  if (n.includes('purple')) return '#9333ea';
  return '#94a3b8';
};

const Inventory = ({ products, fetchData, API_URL, role }) => {
  const [form, setForm] = useState({ id: null, colorName: '', unitWeight: '', unitPrice: '', stockCount: '' });

  // ✅ [FIX] Inventory Tab එකට ආපු ගමන් Data Refresh වෙන්න
  // useEffect(() => {
  //   fetchData();
  // }, []);

  const handleSave = async () => {
    if (role === 'staff') return alert("Access Denied: Staff cannot add/edit items.");
    
    if(!form.colorName || !form.unitPrice || !form.stockCount) {
        return alert("Please fill all required fields!");
    }

    try {
      if (form.id) { 
        await axios.put(`${API_URL}/products/${form.id}`, form);
        alert("Updated! ✅");
      } else { 
        await axios.post(`${API_URL}/products`, form);
        alert("Added! ✅");
      }
      setForm({ id: null, colorName: '', unitWeight: '', unitPrice: '', stockCount: '' });
      fetchData();
    } catch (error) {
      alert("Error saving product");
    }
  };

  const handleDelete = async (id) => {
    if (role === 'staff') return alert("Access Denied");
    if(confirm("Delete this product?")) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        fetchData();
      } catch (error) {
        alert("Delete Failed");
      }
    }
  };

  const handleReset = async () => {
    if (role !== 'admin') return alert("Admin Only!");
    if(confirm("⚠️ FACTORY RESET: Delete ALL Data?")) {
      try { await axios.post(`${API_URL}/reset`); alert("System Reset! 🗑️"); fetchData(); } 
      catch (error) { alert("Reset Failed"); }
    }
  };

  const handleEdit = (p) => {
    if (role === 'staff') return alert("Access Denied");
    setForm({ id: p._id, colorName: p.colorName, unitWeight: p.unitWeight, unitPrice: p.unitPrice, stockCount: p.stockCount });
  };

  return (
    <div className="space-y-6">
      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center">
         <h3 className="text-xl font-bold text-gray-800">Inventory Management</h3>
         {role === 'admin' && (
            <button onClick={handleReset} className="text-red-500 text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50 flex gap-1 items-center">
                <Trash2 size={12}/> Reset System
            </button>
         )}
      </div>

      {/* FORM AREA */}
      {role !== 'staff' ? (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Color</label>
              <input className="w-full border p-2 rounded mt-1" value={form.colorName} onChange={e=>setForm({...form, colorName:e.target.value})} placeholder="Ex: Blue" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Weight</label>
              <input className="w-full border p-2 rounded mt-1" type="number" value={form.unitWeight} onChange={e=>setForm({...form, unitWeight:e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Price</label>
              <input className="w-full border p-2 rounded mt-1" type="number" value={form.unitPrice} onChange={e=>setForm({...form, unitPrice:e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
              <input className="w-full border p-2 rounded mt-1" type="number" value={form.stockCount} onChange={e=>setForm({...form, stockCount:e.target.value})} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-green-600 text-white p-2 rounded w-full flex justify-center items-center gap-1 font-bold shadow-sm hover:bg-green-700">
                <Save size={16}/> {form.id ? 'Update' : 'Add'}
              </button>
              {form.id && <button onClick={()=>setForm({id:null, colorName:'', unitWeight:'', unitPrice:'', stockCount:''})} className="bg-gray-500 text-white p-2 rounded font-bold">Cancel</button>}
            </div>
          </div>
        </div>
      ) : (
        <div >
            {/* <Lock size={20} /> */}
            {/* <span className="font-medium text-sm">Inventory is Read-Only for Staff.</span> */}
        </div>
      )}

      {/* TABLE AREA */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-bold">
              <tr>
                <th className="p-3 md:p-4">Color</th>
                <th className="p-3 md:p-4">Weight</th>
                <th className="p-3 md:p-4">Price</th>
                <th className="p-3 md:p-4">Stock</th>
                {role !== 'staff' && <th className="p-3 md:p-4">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {products.length === 0 ? (
                  <tr><td colSpan="5" className="p-6 text-center text-gray-400">Loading or Empty...</td></tr>
              ) : (
                  products.map(p => (
                  <tr key={p._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3 md:p-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border shadow-sm flex-shrink-0" style={{backgroundColor: getColor(p.colorName)}}></div>
                          <span className="font-bold text-gray-700 capitalize text-xs md:text-sm">{p.colorName}</span>
                        </div>
                      </td>
                      <td className="p-3 md:p-4 text-xs md:text-sm">{p.unitWeight}g</td>
                      <td className="p-3 md:p-4 font-medium text-xs md:text-sm">Rs. {p.unitPrice}</td>
                      <td className="p-3 md:p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${p.stockCount < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                              {p.stockCount}
                          </span>
                      </td>
                      {role !== 'staff' && (
                          <td className="p-3 md:p-4">
                            <div className="flex gap-1 md:gap-2">
                              <button onClick={()=>handleEdit(p)} className="text-blue-500 hover:bg-blue-50 p-1.5 md:p-2 rounded"><Edit size={14} className="md:w-4 md:h-4"/></button>
                              <button onClick={()=>handleDelete(p._id)} className="text-red-500 hover:bg-red-50 p-1.5 md:p-2 rounded"><Trash2 size={14} className="md:w-4 md:h-4"/></button>
                            </div>
                          </td>
                      )}
                  </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;