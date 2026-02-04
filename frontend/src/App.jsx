import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCcw } from 'lucide-react';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesPOS from './components/SalesPOS';
import TransactionHistory from './components/TransactionHistory';
import Inventory from './components/Inventory';

// PWA සහ Deploy කළ පසු backend එකට සම්බන්ධ වීමට
const API_URL = 'https://exotic-pos-system.onrender.com/api';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // [NEW] Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // --- MAIN LAYOUT (UPDATED FOR MOBILE) ---
  // --- MAIN LAYOUT (UPDATED) ---
  return (
    <div className="flex min-h-screen bg-gray-50 font-sans relative">
      {/* SIDEBAR */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto pt-16 md:pt-8 h-screen">
        <header className="flex justify-between mb-8 items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold capitalize">{activeTab} Overview</h2>
            <button onClick={fetchData} className="p-2 bg-white rounded-full shadow text-blue-600">
              <RefreshCcw size={18}/>
            </button>
          </div>
          <div className="text-xs md:text-sm text-gray-500 hidden md:block">{new Date().toDateString()}</div>
        </header>
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* 👇 මම මෙන්න මේ ටිකට API_URL={API_URL} එකතු කළා 👇 */}
            
            {activeTab === 'dashboard' && (
                <Dashboard 
                    sales={sales} 
                    products={products} 
                    fetchData={fetchData} 
                    API_URL={API_URL}  // ✅ මේක නැතුව Dashboard එකේ End Batch වැඩ කරන්නේ නෑ
                />
            )}

            {activeTab === 'sales' && (
                <SalesPOS 
                    products={products} 
                    fetchData={fetchData} 
                    API_URL={API_URL}  // ✅ මේක නැතුව බිල් දාන්න බෑ
                />
            )}

            {activeTab === 'transactions' && (
                <TransactionHistory 
                    sales={sales} 
                    fetchData={fetchData} 
                    API_URL={API_URL}  // ✅ මේක නැතුව තමයි Delete කරද්දී Error ආවේ
                />
            )}

            {activeTab === 'inventory' && (
                <Inventory 
                    products={products} 
                    fetchData={fetchData} 
                    API_URL={API_URL}  // ✅ මේක නැතුව බඩු Add කරන්න බෑ
                />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;