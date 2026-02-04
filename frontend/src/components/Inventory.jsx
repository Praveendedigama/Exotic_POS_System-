import React, { useState } from 'react';
import axios from 'axios';
import { Trash2, Save, Edit } from 'lucide-react';

// [REMOVE] මේ පේළිය මකන්න, දැන් අපි මේක App.jsx එකෙන් එවනවා.
// const API_URL = 'http://localhost:5000/api'; 

const getColor = (name) => {
  const n = name.toLowerCase();
  if (n.includes('blue') || n.includes('white')) return '#3b82f6';
  if (n.includes('red')) return '#ef4444';
  if (n.includes('yellow')) return '#eab308';
  if (n.includes('green')) return '#22c55e';
  return '#94a3b8';
};

// [CHANGE] මෙතනට API_URL එක props විදිහට ගන්න
const Inventory = ({ products, fetchData, API_URL }) => {
  const [form, setForm] = useState({ id: null, colorName: '', unitWeight: '', unitPrice: '', stockCount: '' });

  const handleSave = async () => {
    if (form.id) { 
      // දැන් මෙයා පාවිච්චි කරන්නේ App.jsx එකෙන් එවපු ලින්ක් එක
      await axios.put(`${API_URL}/products/${form.id}`, form);
    } else { 
      await axios.post(`${API_URL}/products`, form);
    }
    setForm({ id: null, colorName: '', unitWeight: '', unitPrice: '', stockCount: '' });
    fetchData();
    alert(form.id ? "Updated! ✅" : "Added! ✅");
  };

  const handleDelete = async (id) => {
    if(confirm("Delete this product?")) {
      await axios.delete(`${API_URL}/products/${id}`);
      fetchData();
    }
  };

  const handleReset = async () => {
    if(confirm("⚠️ System Reset: Delete ALL Data?")) {
      try { 
        await axios.post(`${API_URL}/reset`); 
        alert("Reset Successful! 🗑️"); 
        fetchData(); 
      } 
      catch (error) { 
        alert("Reset Failed"); 
      }
    }
  };

  const handleEdit = (p) => {
    setForm({ id: p._id, colorName: p.colorName, unitWeight: p.unitWeight, unitPrice: p.unitPrice, stockCount: p.stockCount });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={handleReset} className="text-red-500 text-xs hover:bg-red-50 px-3 py-1 rounded border border-red-200 flex items-center gap-1"><Trash2 size={14}/> Reset</button>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4">{form.id ? 'Edit Product' : 'Add New Product'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500">Color</label>
            <input className="w-full border p-2 rounded" value={form.colorName} onChange={e=>setForm({...form, colorName:e.target.value})} placeholder="Ex: Blue" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Weight</label>
            <input className="w-full border p-2 rounded" type="number" value={form.unitWeight} onChange={e=>setForm({...form, unitWeight:e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Price</label>
            <input className="w-full border p-2 rounded" type="number" value={form.unitPrice} onChange={e=>setForm({...form, unitPrice:e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Stock</label>
            <input className="w-full border p-2 rounded" type="number" value={form.stockCount} onChange={e=>setForm({...form, stockCount:e.target.value})} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-green-600 text-white p-2 rounded w-full flex justify-center items-center gap-1"><Save size={16}/> {form.id ? 'Update' : 'Add'}</button>
            {form.id && <button onClick={()=>setForm({id:null, colorName:'', unitWeight:'', unitPrice:'', stockCount:''})} className="bg-gray-500 text-white p-2 rounded">Cancel</button>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b text-sm uppercase text-gray-500">
            <tr>
              <th className="p-4">Color</th>
              <th className="p-4">Weight</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Actions</th>
            </tr>
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

export default Inventory;