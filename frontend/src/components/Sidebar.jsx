import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, FileText, Menu, X } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }) => {
  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden absolute top-0 left-0 w-full bg-slate-900 text-white p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold tracking-wider">Exotic <span className="text-blue-400">POS</span></h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></button>
      </div>

      {/* SIDEBAR (Responsive) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-5 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold tracking-wider hidden md:block">Exotic <span className="text-blue-400">POS</span></h1>
          <h1 className="text-2xl font-bold tracking-wider md:hidden">Menu</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X /></button>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false) }} className={`w-full flex gap-3 p-3 rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><LayoutDashboard size={20} /> Dashboard</button>
          <button onClick={() => { setActiveTab('sales'); setIsSidebarOpen(false) }} className={`w-full flex gap-3 p-3 rounded-lg ${activeTab === 'sales' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><ShoppingCart size={20} /> Sales / POS</button>
          <button onClick={() => { setActiveTab('transactions'); setIsSidebarOpen(false) }} className={`w-full flex gap-3 p-3 rounded-lg ${activeTab === 'transactions' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><FileText size={20} /> Transactions</button>
          <button onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false) }} className={`w-full flex gap-3 p-3 rounded-lg ${activeTab === 'inventory' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><Package size={20} /> Inventory</button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;