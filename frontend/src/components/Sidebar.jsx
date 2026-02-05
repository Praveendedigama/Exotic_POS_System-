import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, History, Menu, X } from 'lucide-react';
// History icon එක import කරන්න අමතක කරන්න එපා

// [FIX 1] මෙතනට 'role' prop එක එකතු කළා
const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, role }) => {

  // Menu Items Array එක (Logic එක මෙතන)
  const menuItems = [
    // Staff නෙවෙයි නම් විතරක් Dashboard පෙන්නන්න
    ...(role !== 'staff' ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { id: 'sales', label: 'Sales / POS', icon: ShoppingCart },
    { id: 'transactions', label: 'History', icon: History },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ];

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden absolute top-0 left-0 w-full bg-slate-900 text-white p-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold tracking-wider">Exotic <span className="text-blue-400">POS</span></h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></button>
      </div>

      {/* SIDEBAR CONTAINER */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-5 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold tracking-wider hidden md:block">Exotic <span className="text-blue-400">POS</span></h1>
          <h1 className="text-2xl font-bold tracking-wider md:hidden">Menu</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X /></button>
        </div>
        
        {/* [FIX 2] Hardcode නොකර, Array එක Map කිරීම */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { 
                setActiveTab(item.id); 
                setIsSidebarOpen(false); 
              }} 
              className={`w-full flex gap-3 p-3 rounded-lg transition-all items-center font-medium
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={20} /> 
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;