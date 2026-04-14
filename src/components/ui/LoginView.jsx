// Updated LoginView.jsx - Fixed for Docker
import React, { useState } from 'react';
import { User, Lock, Loader, Moon, Sun, AtSign, Building2, ChefHat, ArrowRight } from 'lucide-react';
import { getTheme, COMMON_STYLES, FONTS } from './theme';

/* --- MAIN COMPONENT --- */
export default function LoginView({ onLogin, isDarkMode, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    restaurantId: '',
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const theme = getTheme(isDarkMode);

  // Log API URL for debugging
  console.log(`🔌 LoginView using API_URL: ${API_URL}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const loginPayload = new URLSearchParams();
        loginPayload.append("username", formData.email); 
        loginPayload.append("password", formData.password);

        console.log(`🔐 Attempting login to: ${API_URL}/auth/login`);
        
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: loginPayload
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Login failed');
        
        console.log("✅ Login successful!");
        onLogin(data.user, data.access_token);

      } else {
        console.log(`📝 Attempting signup to: ${API_URL}/auth/restaurant-signup`);
        
        const res = await fetch(`${API_URL}/auth/restaurant-signup?restaurant_name=${encodeURIComponent(formData.restaurantId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: "admin"
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Signup failed');
        
        console.log("✅ Signup successful!");
        onLogin(data.user, data.access_token);
      }
    } catch (err) {
      console.error("❌ Auth error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 antialiased ${theme.bg.main}`}
      style={{ fontFamily: FONTS.sans }}
    >
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#002366]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#002366]/5 rounded-full blur-3xl" />
      </div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={onToggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-xl transition-all duration-300 hover:scale-105 z-10 ${
          isDarkMode 
            ? 'bg-[#1a1a1a] text-white hover:bg-[#002366]/20' 
            : 'bg-gray-100 text-black hover:bg-gray-200'
        }`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Main Login Card */}
      <div className={`relative w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 ${COMMON_STYLES.modal(isDarkMode)}`}
        style={{
          backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff",
          borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
        }}
      >
        {/* Logo/Icon Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#002366] to-[#0044cc] shadow-lg shadow-[#002366]/20">
              <ChefHat size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
            {isLogin ? 'Sign in to your POS account' : 'Start your restaurant journey with us'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`p-3 rounded-xl mb-6 text-sm font-medium text-center border animate-in fade-in slide-in-from-top-2 ${
            isDarkMode
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field - MOVED TO TOP for autofill priority */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme.text.secondary}`}>
              Email Address
            </label>
            <div className="relative group">
              <AtSign className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary} transition-colors group-hover:text-[#002366]`} size={18} />
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:border-[#002366] focus:ring-1 focus:ring-[#002366] ${COMMON_STYLES.input(isDarkMode)}`}
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme.text.secondary}`}>
              Password
            </label>
            <div className="relative group">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary} transition-colors group-hover:text-[#002366]`} size={18} />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:border-[#002366] focus:ring-1 focus:ring-[#002366] ${COMMON_STYLES.input(isDarkMode)}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {/* Restaurant ID / Name Field - MOVED TO BOTTOM for Signup only */}
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme.text.secondary}`}>
                Restaurant Name
              </label>
              <div className="relative group">
                <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary} transition-colors group-hover:text-[#002366]`} size={18} />
                <input
                  type="text"
                  name="restaurantName"
                  autoComplete="off"
                  required={!isLogin}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:border-[#002366] focus:ring-1 focus:ring-[#002366] ${COMMON_STYLES.input(isDarkMode)}`}
                  placeholder="My Awesome Restaurant"
                  value={formData.restaurantId}
                  onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Username (Signup only) - MOVED after email */}
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme.text.secondary}`}>
                Username
              </label>
              <div className="relative group">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text.secondary} transition-colors group-hover:text-[#002366]`} size={18} />
                <input
                  type="text"
                  name="username"
                  autoComplete="off"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:border-[#002366] focus:ring-1 focus:ring-[#002366] ${COMMON_STYLES.input(isDarkMode)}`}
                  placeholder="john_doe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-semibold flex justify-center items-center gap-2 mt-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
              isDarkMode 
                ? 'bg-[#002366] text-white hover:bg-[#003388]' 
                : 'bg-[#002366] text-white hover:bg-[#003388]'
            }`}
          >
            {loading ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Login and Signup */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ 
                ...formData, 
                password: '',
                ...(!isLogin ? { email: '', username: '', restaurantId: '' } : {})
              });
            }}
            className={`text-sm font-medium transition-all duration-300 hover:text-[#002366] ${theme.text.secondary}`}
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}