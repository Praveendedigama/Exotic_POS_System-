import React, { useState, useEffect } from 'react';

const SalesForm = ({ products }) => {
  const [customerName, setCustomerName] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Paid');
  const [selectedItems, setSelectedItems] = useState([{ productId: '', quantity: 1, price: 0 }]);

  // පාට තේරූ සැනින් Price එක Auto-fill කරන function එක
  const handleProductChange = (index, productId) => {
    const product = products.find(p => p._id === productId);
    const newItems = [...selectedItems];
    newItems[index].productId = productId;
    newItems[index].price = product ? product.unitPrice : 0; // Auto fill price
    setSelectedItems(newItems);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">New Sale</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input 
          type="text" 
          placeholder="Customer Name" 
          className="border p-2 rounded"
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <input 
          type="date" 
          value={saleDate} 
          className="border p-2 rounded"
          onChange={(e) => setSaleDate(e.target.value)}
        />
      </div>

      {selectedItems.map((item, index) => (
        <div key={index} className="flex gap-4 mb-2">
          <select 
            className="border p-2 flex-1"
            onChange={(e) => handleProductChange(index, e.target.value)}
          >
            <option value="">Select Color</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.colorName}</option>)}
          </select>
          
          <input 
            type="number" 
            placeholder="Qty" 
            className="border p-2 w-20"
            value={item.quantity}
            onChange={(e) => {
                const newItems = [...selectedItems];
                newItems[index].quantity = e.target.value;
                setSelectedItems(newItems);
            }}
          />

          <input 
            type="text" 
            value={item.price} 
            readOnly 
            className="border p-2 w-32 bg-gray-100 font-bold" 
          />
        </div>
      ))}
      
      <button 
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={() => setSelectedItems([...selectedItems, { productId: '', quantity: 1, price: 0 }])}
      >
        + Add Another Item
      </button>
    </div>
  );
};