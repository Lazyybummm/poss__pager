import React, { useState } from 'react';
import { User, Lock, Loader, Moon, Sun, AtSign, Building2, ImageOff } from 'lucide-react';

/* --- LOCAL STYLE CONFIGURATION --- */
const FONTS = {
  sans: '-apple-system, "Segoe UI", "Geist Sans", sans-serif',
};

const COMMON_STYLES = {
  input: (isDarkMode) =>
    `border px-3 py-2 rounded-md text-sm outline-none focus:border-neutral-400 transition-colors ${
      isDarkMode
        ? 'bg-black border-neutral-800 text-white placeholder:text-neutral-600'
        : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400'
    }`,
  modal: (isDarkMode) =>
    `rounded-2xl border shadow-2xl ${
      isDarkMode ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'
    }`,
};

const getTheme = (isDarkMode) => ({
  bg: {
    main: isDarkMode ? 'bg-black' : 'bg-white',
    hover: isDarkMode ? 'hover:bg-neutral-900' : 'hover:bg-neutral-50',
  },
  text: {
    main: isDarkMode ? 'text-white' : 'text-black',
    secondary: isDarkMode ? 'text-neutral-400' : 'text-neutral-600',
  },
  button: {
    primary: isDarkMode
      ? 'bg-white text-black hover:bg-neutral-200'
      : 'bg-black text-white hover:bg-neutral-800',
    secondary: isDarkMode
      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
      : 'bg-neutral-100 text-black hover:bg-neutral-200',
  },
});

/* --- MAIN COMPONENT --- */
export default function LoginView({ onLogin, isDarkMode, onToggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    restaurantId: '', // Used as name in signup, ignored in login
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const API_URL = "localhost:8000";
  const API_URL = import.meta.env.VITE_API_URL;
  const theme = getTheme(isDarkMode);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // --- LOGIN (OAuth2 Form Data) ---
        const loginPayload = new URLSearchParams();
        // We use formData.email because that is where the value is stored in your state
        loginPayload.append("username", formData.email); 
        loginPayload.append("password", formData.password);

        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: loginPayload
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Login failed');
        
        // Pass the user object and token back to the parent component
        onLogin(data.user, data.access_token);

      } else {
        // --- SIGNUP (JSON Data) ---
        const res = await fetch(`${API_URL}/auth/restaurant-signup?restaurant_name=${encodeURIComponent(formData.restaurantId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: "admin",
            restaurant_id: 0 
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Signup failed');
        
        alert('Success! Logging you in...');
        onLogin(data.user, data.access_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 antialiased ${theme.bg.main} ${theme.text.main}`}
      style={{ fontFamily: FONTS.sans }}
    >
      <button
        type="button"
        onClick={onToggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-lg ${theme.button.secondary}`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className={`p-8 w-full max-w-md ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className={`text-sm ${theme.text.secondary}`}>POS System</p>
        </div>

        {error && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-medium text-center border ${
            isDarkMode
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
              {isLogin ? 'Restaurant ID (Optional)' : 'Restaurant Name'}
            </label>
            <div className="relative group">
              <Building2 className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
              <input
                required={!isLogin}
                className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`}
                placeholder={isLogin ? 'e.g. 1' : 'My Awesome Restaurant'}
                value={formData.restaurantId}
                onChange={(e) => setFormData({ ...formData, restaurantId: e.target.value })}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
                Username
              </label>
              <div className="relative group">
                <User className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
                <input
                  required
                  className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`}
                  placeholder="john_doe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
          )}

          <div>
            <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
              Email
            </label>
            <div className="relative group">
              <AtSign className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
              <input
                type="email"
                required
                className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`}
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium uppercase mb-2 ${theme.text.secondary}`}>
              Password
            </label>
            <div className="relative group">
              <Lock className={`absolute left-3 top-3 ${theme.text.secondary}`} size={18} />
              <input
                type="password"
                required
                className={`w-full pl-10 pr-4 py-2.5 ${COMMON_STYLES.input(isDarkMode)}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium flex justify-center items-center gap-2 mt-6 ${theme.button.primary} disabled:opacity-50`}
          >
            {loading ? <Loader className="animate-spin" size={18} /> : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className={`font-medium text-sm transition-colors ${theme.text.secondary} hover:text-blue-500`}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}