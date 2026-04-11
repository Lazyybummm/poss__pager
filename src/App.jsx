import React, { useState, useEffect } from 'react';
import RestaurantVendorUI from './components/ui/RestaurantVendorUI';
import LoginView from './components/ui/LoginView';

// ✅ DYNAMIC BACKEND CONNECTION
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lowStock, setLowStock] = useState([]); // ✅ ADD THIS STATE

  // 1. Check for Session on Load
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const savedRole = localStorage.getItem("user_role");
    const savedName = localStorage.getItem("username");
    if (token) {
      console.log(`✅ Connected to Backend: ${API_URL}`);
      setUser({ 
        role: savedRole || "cashier", 
        username: savedName || "User",
        token 
      });
    }
  }, []);

  // 2. Handle Login Success (Called by LoginView)
  const handleLoginSuccess = (userData, token) => {
    const userName = userData?.username || "Admin"; 
    const userRole = userData?.role || "cashier";
    
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_role", userRole);
    localStorage.setItem("username", userName);
    
    setUser({ ...userData, username: userName, token });
  };

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    setUser(null);
    setLowStock([]); // ✅ Clear lowStock on logout
  };

  // If Logged In: Show Main POS UI
  if (user) {
    return (
      <RestaurantVendorUI 
        user={user} 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        API_URL={API_URL}
        lowStock={lowStock}           // ✅ PASS lowStock DOWN
        setLowStock={setLowStock}     // ✅ PASS setLowStock DOWN
      />
    );
  }

  // If Logged Out: Show Login View
  return (
    <LoginView 
      onLogin={handleLoginSuccess} 
      isDarkMode={isDarkMode} 
      onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
    />
  );
}