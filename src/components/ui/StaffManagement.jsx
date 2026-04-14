// StaffManagement.jsx - Complete Production Ready
import React, { useState, useMemo, useEffect } from "react";
import { Plus, User, Settings, Trash2, X, Mail, UserCheck, Loader, Search, Filter, AlertCircle } from "lucide-react";
import { getTheme, COMMON_STYLES } from "./theme";

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

// Edit Staff Modal
function EditStaffModal({ isOpen, onClose, onSave, user, isDarkMode, currentUserRole }) {
  const [form, setForm] = useState({ username: "", email: "", role: "" });
  const [loading, setLoading] = useState(false);
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    if (user && isOpen) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        role: user.role || "cashier"
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async () => {
    if (!form.username || !form.email) {
      alert("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await onSave({ ...user, ...form });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = currentUserRole === "admin"
    ? [{ value: "cashier", label: "Cashier" }, { value: "manager", label: "Manager" }]
    : [{ value: "cashier", label: "Cashier" }];

  const inputStyle = {
    width: "100%",
    background: isDarkMode ? "#0d0d0d" : "#f5f5f5",
    border: `1px solid ${isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.15)"}`,
    color: isDarkMode ? "#e8e8e8" : "#1a1a1a",
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    outline: "none",
    fontSize: "0.875rem",
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 ${COMMON_STYLES.modal(isDarkMode)}`}>
        <div className={`p-5 border-b flex justify-between items-center`} style={{
          backgroundColor: isDarkMode ? "#111111" : "#fafafa",
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)"
        }}>
          <h3 className="text-lg font-semibold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            Edit Staff Member
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase mb-1.5 block opacity-60">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
              style={inputStyle}
            />
          </div>
          
          <div>
            <label className="text-xs font-medium uppercase mb-1.5 block opacity-60">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              style={inputStyle}
            />
          </div>
          
          <div>
            <label className="text-xs font-medium uppercase mb-1.5 block opacity-60">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
              disabled={currentUserRole !== "admin"}
            >
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            {currentUserRole !== "admin" && (
              <p className="text-xs mt-1 opacity-50">Role cannot be changed (admin only)</p>
            )}
          </div>
        </div>
        
        <div className={`p-5 border-t flex gap-3`} style={{
          borderColor: isDarkMode ? "rgba(255,255,240,0.08)" : "rgba(0,35,102,0.08)",
          backgroundColor: isDarkMode ? "#0a0a0a" : "#ffffff"
        }}>
          <button onClick={onClose} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${getTheme(isDarkMode).button.secondary}`}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2" style={{ backgroundColor: "#002366", color: "#FFFFF0" }}>
            {loading && <Loader size={16} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

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

export default function StaffManagement({
  isDarkMode,
  usersList = [],
  onAddUser,
  onDeleteUser,
  onEditUser,
  currentUserRole = "cashier",
}) {
  const theme = getTheme(isDarkMode);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSuccess, setShowSuccess] = useState({ open: false, message: "" });
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "cashier",
  });

  const availableRoles = currentUserRole === "admin"
    ? [{ value: "cashier", label: "Cashier" }, { value: "manager", label: "Manager" }]
    : [{ value: "cashier", label: "Cashier" }];

  const handleCreate = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setShowSuccess({ open: true, message: "Please fill all fields" });
      return;
    }
    setLoading(true);
    try {
      await onAddUser(newUser);
      setShowSuccess({ open: true, message: `${newUser.username} added successfully!` });
      setNewUser({ username: "", email: "", password: "", role: "cashier" });
      setShowAddModal(false);
    } catch (err) {
      setShowSuccess({ open: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    if (!user || !user.id) {
      setShowSuccess({ open: true, message: "Cannot edit this user: Invalid data" });
      return;
    }
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedUser) => {
    try {
      await onEditUser(updatedUser);
      setShowSuccess({ open: true, message: `${updatedUser.username} updated successfully!` });
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err) {
      setShowSuccess({ open: true, message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await onDeleteUser(deleteTarget.id);
      setShowSuccess({ open: true, message: `${deleteTarget.username} removed successfully!` });
      setDeleteTarget(null);
    } catch (err) {
      setShowSuccess({ open: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...(usersList || [])];
    
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterBy !== "all") {
      filtered = filtered.filter((u) => u.role === filterBy);
    }
    
    filtered.sort((a, b) => {
      if (sortBy === "name-asc") return (a.username || "").localeCompare(b.username || "");
      if (sortBy === "name-desc") return (b.username || "").localeCompare(a.username || "");
      if (sortBy === "role") return (a.role || "").localeCompare(b.role || "");
      return 0;
    });
    return filtered;
  }, [usersList, filterBy, sortBy, searchQuery]);

  const roleConfig = {
    admin: { label: "Admin", color: "purple" },
    manager: { label: "Manager", color: "blue" },
    cashier: { label: "Cashier", color: "green" },
  };

  const getRoleColor = (role) => {
    const colors = {
      purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      green: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    };
    return colors[roleConfig[role]?.color] || colors.green;
  };

  return (
    <div className="min-h-full w-full px-6 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: isDarkMode ? "#FFFFF0" : "#1a1a1a" }}>
            Staff Management
          </h2>
          <p className="text-sm mt-1" style={{ color: isDarkMode ? "rgba(255,255,240,0.6)" : "rgba(0,0,0,0.6)" }}>
            Manage your team members and their roles
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:shadow-lg hover:scale-105"
          style={{ backgroundColor: "#002366", color: "#FFFFF0" }}
        >
          <Plus size={18} />
          Add Member
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: isDarkMode ? "rgba(255,255,240,0.4)" : "rgba(0,0,0,0.4)" }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${COMMON_STYLES.input(isDarkMode)}`}
          />
        </div>
        <div className="flex gap-3">
          <select
            className={`${COMMON_STYLES.select(isDarkMode)} text-sm rounded-xl px-4 py-3`}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
            <option value="role">Role</option>
          </select>
          <select
            className={`${COMMON_STYLES.select(isDarkMode)} text-sm rounded-xl px-4 py-3`}
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>
        </div>
      </div>

      {filteredAndSortedUsers.length === 0 ? (
        <div className="text-center py-20">
          <User size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-base opacity-60">No staff members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAndSortedUsers.map((user) => {
            const roleColor = getRoleColor(user.role);
            const canEdit = currentUserRole === "admin" || (currentUserRole === "manager" && user.role === "cashier");
            const canDelete = currentUserRole === "admin" && user.role !== "admin";
            
            return (
              <div
                key={user.id}
                className={`relative rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group`}
                style={{
                  backgroundColor: isDarkMode ? "#111111" : "#ffffff",
                  borderColor: isDarkMode ? "rgba(255,255,240,0.1)" : "rgba(0,35,102,0.1)"
                }}
              >
                <div className="h-1 w-full bg-gradient-to-r from-[#002366] to-[#0044cc]" />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 ${roleColor}`}>
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-lg leading-tight truncate ${theme.text.main}`}>
                          {user.username || "Unknown"}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${roleColor}`}>
                          {roleConfig[user.role]?.label || user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Mail size={14} className="opacity-40" />
                        <p className={`text-sm truncate ${theme.text.muted}`}>
                          {user.email || "No email"}
                        </p>
                      </div>
                    </div>
                    {(canEdit || canDelete) && (
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 rounded-md transition-colors hover:bg-blue-500/10"
                            title="Edit"
                          >
                            <Settings size={16} className={isDarkMode ? "text-white" : "text-[#002366]"} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="p-2 rounded-md transition-colors text-red-500 hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-lg w-full p-6 rounded-xl border shadow-2xl ${COMMON_STYLES.modal(isDarkMode)} animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${theme.text.main}`}>Add New Member</h3>
              <button onClick={() => setShowAddModal(false)} className={`p-1.5 rounded-md transition-colors ${theme.button.ghost}`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Username</label>
                <input
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="john_doe"
                />
              </div>

              <div>
                <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Email</label>
                <input
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@pos.com"
                />
              </div>

              <div>
                <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Password</label>
                <input
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div>
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
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${theme.button.ghost}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                style={{ backgroundColor: "#002366", color: "#FFFFF0" }}
              >
                {loading && <Loader size={16} className="animate-spin" />}
                Create Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditStaffModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSave={handleSaveEdit}
        user={editingUser}
        isDarkMode={isDarkMode}
        currentUserRole={currentUserRole}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
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