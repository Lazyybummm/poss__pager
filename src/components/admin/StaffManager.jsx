// Updated StaffManager.jsx - Removed double confirmation, added professional modals
import React, { useState, useEffect } from "react";
import { User, Plus, Trash2, Settings, X, Mail, BadgeCheck, RefreshCw, Search, Filter, Shield, UserCheck, AlertCircle, Loader } from "lucide-react";
import { COMMON_STYLES } from "./theme";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem("auth_token");
  const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(cleanUrl, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_role");
    window.location.reload();
  }
  return response;
};

// Delete Confirmation Modal
function DeleteConfirmModal({ isOpen, onClose, onConfirm, userName, isDarkMode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className={`p-5 border-b flex items-center gap-3`} style={{
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
        }}>
          <div className="p-2 rounded-full bg-red-500/10">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Delete Staff Member
            </h3>
            <p className="text-sm mt-0.5" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              Are you sure you want to delete "{userName}"?
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        <div className={`p-5 border-t flex gap-3`} style={{
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)",
          backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff"
        }}>
          <button onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${getTheme(isDarkMode).button.secondary}`}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20">
            Delete Member
          </button>
        </div>
      </div>
    </div>
  );
}

// Success Modal
function SuccessModal({ isOpen, onClose, message, isDarkMode }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className={`p-6 text-center`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center animate-pulse">
            <UserCheck size={32} className="text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            Success!
          </h3>
          <p className="text-sm" style={{ color: isDarkMode ? "rgba(255,255,240,0.7)" : "rgba(0,0,0,0.7)" }}>
            {message}
          </p>
          <button 
            onClick={onClose}
            className="mt-6 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-lg"
            style={{ backgroundColor: "#002366", color: "#FFFFF0" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get theme (since we don't have the import)
function getTheme(isDarkMode) {
  return {
    button: {
      primary: isDarkMode ? "bg-[#002366] text-white hover:bg-[#003388]" : "bg-black text-white hover:bg-neutral-800",
      secondary: isDarkMode ? "bg-[#001a4d] text-white hover:bg-[#002366]" : "bg-neutral-100 text-black hover:bg-neutral-200",
      ghost: isDarkMode ? "text-white hover:bg-[#002366]/20" : "text-neutral-600 hover:bg-neutral-50",
    },
    text: {
      main: isDarkMode ? "text-white" : "text-black",
      secondary: isDarkMode ? "text-white/70" : "text-neutral-600",
    }
  };
}

export default function StaffManager({ 
  isDarkMode, 
  theme: propTheme,
  currentUserRole
}) {
  const theme = propTheme || getTheme(isDarkMode);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [newUser, setNewUser] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    role: "cashier" 
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSuccess, setShowSuccess] = useState({ open: false, message: "" });
  const [submitting, setSubmitting] = useState(false);

  const userRole = currentUserRole || localStorage.getItem("user_role") || "cashier";
  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";

  const getAvailableRoles = () => {
    if (isAdmin) {
      return [
        { value: "cashier", label: "Cashier", description: "Can process orders" },
        { value: "manager", label: "Manager", description: "Can manage staff and view reports" }
      ];
    } else if (isManager) {
      return [
        { value: "cashier", label: "Cashier", description: "Can process orders" }
      ];
    }
    return [];
  };

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`${API_URL}/staff/`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch staff");
        console.error("Failed to fetch staff:", errorData);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      setError("Network error: Could not fetch staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    try {
      const response = await apiRequest(`${API_URL}/staff/`, {
        method: "POST",
        body: JSON.stringify(newUser),
      });
      
      if (response.ok) {
        await fetchStaff();
        setNewUser({ username: "", email: "", password: "", role: "cashier" });
        setShowAddForm(false);
        setShowSuccess({ open: true, message: "Staff member added successfully!" });
      } else {
        const errorData = await response.json();
        setShowSuccess({ open: true, message: errorData.detail || "Failed to add staff" });
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      setShowSuccess({ open: true, message: "Network error: Could not add staff member" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    try {
      const response = await apiRequest(`${API_URL}/staff/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(editingUser),
      });
      
      if (response.ok) {
        await fetchStaff();
        setEditingUser(null);
        setShowSuccess({ open: true, message: "Staff member updated successfully!" });
      } else {
        const errorData = await response.json();
        setShowSuccess({ open: true, message: errorData.detail || "Failed to update staff" });
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      setShowSuccess({ open: true, message: "Network error: Could not update staff member" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    
    try {
      const response = await apiRequest(`${API_URL}/staff/${deleteTarget.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await fetchStaff();
        setDeleteTarget(null);
        setShowSuccess({ open: true, message: `${deleteTarget.username} removed successfully!` });
      } else {
        const errorData = await response.json();
        setShowSuccess({ open: true, message: errorData.detail || "Failed to delete staff" });
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      setShowSuccess({ open: true, message: "Network error: Could not delete staff member" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role) => {
    switch(role) {
      case 'admin':
        return { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', icon: Shield };
      case 'manager':
        return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', icon: UserCheck };
      case 'cashier':
        return { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/20', icon: User };
      default:
        return { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20', icon: User };
    }
  };

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    cashier: users.filter(u => u.role === 'cashier').length,
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
              Staff Management
            </h1>
            <p className="text-sm mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
              {isAdmin ? "Full access to manage all staff members" : isManager ? "You can add and manage cashiers" : "View only"}
            </p>
          </div>
          {availableRoles.length > 0 && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:shadow-lg"
              style={{
                backgroundColor: "#002366",
                color: "#FFFFF0",
              }}
            >
              <Plus size={18} />
              Add Staff Member
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl border" style={{
            backgroundColor: isDarkMode ? "#111111" : "#ffffff",
            borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
          }}>
            <p className="text-2xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>{stats.total}</p>
            <p className="text-xs mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Total Staff</p>
          </div>
          <div className="p-4 rounded-xl border" style={{
            backgroundColor: isDarkMode ? "#111111" : "#ffffff",
            borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
          }}>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.admin}</p>
            <p className="text-xs mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Administrators</p>
          </div>
          <div className="p-4 rounded-xl border" style={{
            backgroundColor: isDarkMode ? "#111111" : "#ffffff",
            borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
          }}>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.manager}</p>
            <p className="text-xs mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Managers</p>
          </div>
          <div className="p-4 rounded-xl border" style={{
            backgroundColor: isDarkMode ? "#111111" : "#ffffff",
            borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
          }}>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.cashier}</p>
            <p className="text-xs mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>Cashiers</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${COMMON_STYLES.input(isDarkMode)}`}
          />
        </div>
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`pl-10 pr-8 py-2 rounded-lg border ${COMMON_STYLES.select(isDarkMode)}`}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>
        </div>
        <button
          onClick={fetchStaff}
          className="p-2 rounded-lg border transition-all hover:bg-black/5 dark:hover:bg-white/5"
          style={{
            borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
          }}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ADD USER FORM (Collapsible) */}
      {showAddForm && availableRoles.length > 0 && (
        <div className={`p-6 rounded-xl border mb-8 transition-all ${COMMON_STYLES.card(isDarkMode)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${theme.text.main}`}>
              <Plus size={16} /> Add New Staff Member
            </h3>
            <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Username</label>
              <input
                className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="john_doe"
                required
              />
            </div>
            <div>
              <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Email</label>
              <input
                className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Password</label>
              <input
                className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••"
                required
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Role</label>
                <select
                  className={`w-full ${COMMON_STYLES.select(isDarkMode)}`}
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <p className="text-xs mt-1 opacity-60">{availableRoles.find(r => r.value === newUser.role)?.description}</p>
              </div>
              <button type="submit" disabled={submitting} className={`px-6 py-2 rounded-lg text-sm font-medium mt-6 ${theme.button.primary} flex items-center gap-2`}>
                {submitting && <Loader size={16} className="animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STAFF LIST - Premium Grid Layout */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm opacity-60">Loading staff members...</p>
          </div>
        </div>
      ) : (
        <>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <User size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm opacity-60">No staff members found</p>
              {availableRoles.length > 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "#002366",
                    color: "#FFFFF0",
                  }}
                >
                  Add your first staff member
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((user, index) => {
                const roleStyle = getRoleBadgeStyle(user.role);
                const RoleIcon = roleStyle.icon;
                const canEdit = isAdmin || (isManager && user.role === 'cashier');
                const canDelete = isAdmin && user.role !== 'admin';
                
                return (
                  <div
                    key={user.id || index}
                    className="group relative p-5 rounded-xl border transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                    style={{
                      backgroundColor: isDarkMode ? "#111111" : "#ffffff",
                      borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)",
                    }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-[#002366] to-[#0044cc]" />
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`p-3 rounded-xl ${roleStyle.bg}`}>
                            <RoleIcon size={22} className={roleStyle.text} />
                          </div>
                          <BadgeCheck size={14} className={`absolute -bottom-1 -right-1 ${roleStyle.text}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                            {user.username}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${roleStyle.bg} ${roleStyle.text} border ${roleStyle.border}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                      
                      {(canEdit || canDelete) && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          {canEdit && (
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                            >
                              <Settings size={16} className="text-blue-500" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(user)}
                              className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t" style={{ borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)" }}>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="opacity-40" />
                        <span className="text-xs" style={{ color: isDarkMode ? "rgba(255,255,240,0.7)" : "rgba(0,0,0,0.7)" }}>
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-0 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.card(isDarkMode)}`}>
            <div className={`p-5 border-b flex justify-between items-center`} style={{
              backgroundColor: isDarkMode ? "#111111" : "#fafafa",
              borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
            }}>
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[#002366]" />
                <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
                  Edit Staff Member
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-5">
              <div>
                <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Username</label>
                <input
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  placeholder="Username"
                  required
                />
              </div>
              
              <div>
                <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Email</label>
                <input
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  placeholder="Email"
                  required
                />
              </div>
              
              <div>
                <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Role</label>
                <select
                  className={`w-full ${COMMON_STYLES.select(isDarkMode)}`}
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  disabled={!isAdmin}
                >
                  <option value="cashier">Cashier</option>
                  {isAdmin && <option value="manager">Manager</option>}
                </select>
                {!isAdmin && (
                  <p className="text-xs mt-1 opacity-60">Role cannot be changed (admin only)</p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${theme.button.secondary}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-lg flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "#002366",
                    color: "#FFFFF0",
                  }}
                >
                  {submitting && <Loader size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteUser}
          userName={deleteTarget.username}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess.open}
        onClose={() => setShowSuccess({ open: false, message: "" })}
        message={showSuccess.message}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}