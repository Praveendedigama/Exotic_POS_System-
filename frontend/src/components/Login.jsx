import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User } from 'lucide-react';

const Login = ({ onLogin, API_URL }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      onLogin(res.data); // App.jsx එකට User ව යවනවා
    } catch (err) {
      setError("Invalid Username or Password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">System Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1">Username</label>
            <div className="flex items-center border rounded-lg p-2 bg-gray-50">
              <User size={18} className="text-gray-400 mr-2"/>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="bg-transparent outline-none w-full"
                placeholder="Enter username"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-1">Password</label>
            <div className="flex items-center border rounded-lg p-2 bg-gray-50">
              <Lock size={18} className="text-gray-400 mr-2"/>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="bg-transparent outline-none w-full"
                placeholder="Enter password"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;