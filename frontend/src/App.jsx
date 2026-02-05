import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCcw } from 'lucide-react';
import { SignedIn, SignedOut, SignIn, UserButton, useUser } from "@clerk/clerk-react";

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesPOS from './components/SalesPOS';
import TransactionHistory from './components/TransactionHistory';
import Inventory from './components/Inventory';
//update check
// Backend URL
const API_URL = 'https://exotic-pos-system.onrender.com/api';
// const API_URL = 'http://localhost:5000/api';

const App = () => {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userRole = user?.publicMetadata?.role || 'staff';

  const fetchData = async () => {
    // setLoading(true); <-- මෙය අයින් කරන්න (Smooth Refresh සඳහා)
    try {
      const pRes = await axios.get(`${API_URL}/products`);
      const sRes = await axios.get(`${API_URL}/sales`);
      setProducts(pRes.data);
      setSales(sRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded]);

useEffect(() => {
    if (isLoaded && user && userRole === 'staff' && activeTab === 'dashboard') {
      setActiveTab('sales');
    }
  }, [isLoaded, user, userRole, activeTab]);

  // Loading Screen (System Startup Only)
  if (!isLoaded) return <div className="h-screen flex items-center justify-center text-blue-600 font-bold">System Loading...</div>;

  return (
    <>
      <SignedOut>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
          <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 w-full max-w-md text-center">
            <h1 className="text-3xl font-bold text-white mb-6">Exotic POS System 🛒</h1>
            <div className="flex justify-center"><SignIn /></div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex min-h-screen bg-gray-50 font-sans relative">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} role={userRole} />

          <div className="flex-1 p-4 md:p-8 overflow-y-auto pt-16 md:pt-8 h-screen">
            <header className="flex justify-between mb-8 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <h2 className="text-xl md:text-2xl font-bold capitalize text-gray-800">{activeTab} Overview</h2>
                <button onClick={fetchData} className="p-2 bg-gray-50 hover:bg-blue-50 rounded-full text-blue-600 transition-colors">
                  <RefreshCcw size={18}/>
                </button>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-gray-700">{user?.fullName}</p>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full uppercase font-bold text-gray-600">{userRole}</span>
                 </div>
                 <UserButton afterSignOutUrl="/" />
              </div>
            </header>

            {loading ? (
              <div className="text-center py-20 text-gray-500">Updating...</div>
            ) : (
              <>
                {activeTab === 'dashboard' && userRole !== 'staff' && (
                    <Dashboard sales={sales} products={products} fetchData={fetchData} API_URL={API_URL} role={userRole} />
                )}
                {activeTab === 'sales' && (
                    <SalesPOS products={products} fetchData={fetchData} API_URL={API_URL} />
                )}
                {activeTab === 'transactions' && (
                    <TransactionHistory sales={sales} fetchData={fetchData} API_URL={API_URL} role={userRole} />
                )}
                {activeTab === 'inventory' && (
                    <Inventory products={products} fetchData={fetchData} API_URL={API_URL} role={userRole} />
                )}
              </>
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
};

export default App;