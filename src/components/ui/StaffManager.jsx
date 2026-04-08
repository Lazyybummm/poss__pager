import React, { useState } from "react";
import { User, Plus, Trash2, Settings, X } from "lucide-react";
import { COMMON_STYLES } from "./theme";

export default function StaffManager({ 
  usersList, 
  isDarkMode, 
  theme, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}) {
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "cashier" });
  const [editingUser, setEditingUser] = useState(null);

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    onAddUser(newUser);
    setNewUser({ username: "", email: "", password: "", role: "cashier" });
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    onUpdateUser(editingUser);
    setEditingUser(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-semibold mb-8">Staff Management</h2>

      {/* ADD USER FORM */}
      <div className={`p-6 rounded-lg border mb-8 ${COMMON_STYLES.card(isDarkMode)}`}>
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${theme.text.main}`}>
          <Plus size={16} /> Add New Staff
        </h3>
        <form onSubmit={handleSubmitAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}>Username</label>
            <input
              className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              placeholder="username"
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
              placeholder="email@pos.com"
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
              placeholder="••••"
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
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className={`px-4 py-2 rounded-md text-sm font-medium ${theme.button.primary}`}>
              Create
            </button>
          </div>
        </form>
      </div>

      {/* STAFF LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usersList.map((u) => (
          <div key={u.id} className={`p-5 rounded-lg border flex justify-between items-center group transition-colors ${COMMON_STYLES.card(isDarkMode)}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-md ${theme.bg.subtle}`}><User size={20} /></div>
              <div>
                <p className="font-medium text-sm">{u.username}</p>
                <p className={`text-xs font-medium ${theme.text.tertiary}`}>{u.role}</p>
                <p className={`text-xs ${theme.text.muted}`}>{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => setEditingUser(u)} className="p-2 rounded-md hover:bg-blue-500/10 text-blue-500"><Settings size={18} /></button>
              <button onClick={() => onDeleteUser(u.id)} className="p-2 rounded-md hover:bg-red-500/10 text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl ${COMMON_STYLES.card(isDarkMode)}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Staff</h3>
              <button onClick={() => setEditingUser(null)} className={theme.button.ghost}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <input className={COMMON_STYLES.input(isDarkMode)} value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} placeholder="Username" />
              <input className={COMMON_STYLES.input(isDarkMode)} type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} placeholder="Email" />
              <select className={COMMON_STYLES.select(isDarkMode)} value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className={`w-full py-2 rounded-xl ${theme.button.primary}`}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}