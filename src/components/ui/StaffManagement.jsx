import React, { useState, useMemo } from "react";
import { Plus, User, Settings, Trash2,X, Shield, ChevronDown } from "lucide-react";
import { getTheme, COMMON_STYLES } from "./theme";

export default function StaffManagement({
  isDarkMode,
  usersList,
  onAddUser,
  onDeleteUser,
  onEditUser,
  currentUserRole = "cashier",
}) {
  const theme = getTheme(isDarkMode);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "cashier",
  });

  const availableRoles =
    currentUserRole === "admin"
      ? ["cashier", "manager", "admin"]
      : ["cashier"];

  const handleCreate = () => {
    onAddUser(newUser);
    setNewUser({ username: "", email: "", password: "", role: "cashier" });
    setShowAddModal(false);
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...usersList];
    if (filterBy !== "all") {
      filtered = filtered.filter((u) => u.role === filterBy);
    }
    filtered.sort((a, b) => {
      if (sortBy === "name-asc") return a.username.localeCompare(b.username);
      if (sortBy === "name-desc") return b.username.localeCompare(a.username);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      return 0;
    });
    return filtered;
  }, [usersList, filterBy, sortBy]);

  // Role config: accent color + label
  const roleConfig = {
    admin: {
      label: "Admin",
      light: {
        card: "border-blue-200 bg-blue-50/40",
        badge: "bg-blue-600 text-white",
        accent: "bg-blue-600",
        icon: "text-blue-600",
        initials: "bg-blue-100 text-blue-700",
      },
      dark: {
        card: "border-[#002a5c] bg-[#001228]",
        badge: "bg-[#0047b3] text-[#e8f0ff]",
        accent: "bg-[#0047b3]",
        icon: "text-[#4d90fe]",
        initials: "bg-[#001e4d] text-[#4d90fe]",
      },
    },
    manager: {
      label: "Manager",
      light: {
        card: "border-emerald-200 bg-emerald-50/40",
        badge: "bg-emerald-600 text-white",
        accent: "bg-emerald-600",
        icon: "text-emerald-600",
        initials: "bg-emerald-100 text-emerald-700",
      },
      dark: {
        card: "border-[#004d30] bg-[#001a10]",
        badge: "bg-[#007a4d] text-[#d4f5e9]",
        accent: "bg-[#007a4d]",
        icon: "text-[#33cc99]",
        initials: "bg-[#003320] text-[#33cc99]",
      },
    },
    cashier: {
      label: "Cashier",
      light: {
        card: "border-slate-200 bg-slate-50/40",
        badge: "bg-slate-600 text-white",
        accent: "bg-slate-400",
        icon: "text-slate-500",
        initials: "bg-slate-100 text-slate-600",
      },
      dark: {
        card: "border-[#1e2a3a] bg-[#0a1018]",
        badge: "bg-[#2e3f52] text-[#c8d8e8]",
        accent: "bg-[#2e3f52]",
        icon: "text-[#7a9ab8]",
        initials: "bg-[#1a2535] text-[#7a9ab8]",
      },
    },
  };

  const getRoleStyles = (role) => {
    const config = roleConfig[role] || roleConfig.cashier;
    return isDarkMode ? config.dark : config.light;
  };

  const getInitials = (username) => {
    return username
      .split(/[^a-zA-Z]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  };

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-semibold ${theme.text.main}`}>
            Staff Management
          </h2>
          <p className={`text-sm mt-0.5 ${theme.text.muted}`}>
            {filteredAndSortedUsers.length} member
            {filteredAndSortedUsers.length !== 1 ? "s" : ""}
            {filterBy !== "all" && (
              <span className={theme.text.tertiary}> · filtered by {filterBy}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              className={`${COMMON_STYLES.select(isDarkMode)} text-xs`}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="role">Role</option>
            </select>
          </div>

          <select
            className={`${COMMON_STYLES.select(isDarkMode)} text-xs`}
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${theme.button.primary}`}
          >
            <Plus size={15} />
            Add Member
          </button>
        </div>
      </div>

      {/* 2-Column Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAndSortedUsers.map((user) => {
          const styles = getRoleStyles(user.role);
          const config = roleConfig[user.role] || roleConfig.cashier;
          return (
            <div
              key={user.id}
              className={`relative rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group ${styles.card}`}
            >
              {/* Top accent strip */}
              <div className={`h-1 w-full ${styles.accent}`} />

              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar / Initials */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-base font-bold shrink-0 ${styles.initials}`}
                  >
                    {getInitials(user.username) || <User size={20} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-base leading-tight ${theme.text.main}`}>
                        {user.username}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 truncate ${theme.text.muted}`}>
                      {user.email}
                    </p>
                  </div>

                  {/* Actions — visible on hover */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => onEditUser(user)}
                      className={`p-1.5 rounded-md transition-colors ${theme.button.icon}`}
                      title="Edit"
                    >
                      <Settings size={15} />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className={`p-1.5 rounded-md transition-colors ${
                        isDarkMode
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-red-500 hover:bg-red-50"
                      }`}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAndSortedUsers.length === 0 && (
          <div
            className={`col-span-2 text-center py-16 ${theme.text.tertiary}`}
          >
            No staff members found.
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`max-w-2xl w-full p-6 rounded-xl border shadow-2xl ${COMMON_STYLES.modal(isDarkMode)} animate-in zoom-in-95 duration-200`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${theme.text.main}`}>
                Add New Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-1.5 rounded-md transition-colors ${theme.button.ghost}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}
                >
                  Username
                </label>
                <input
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="john_doe"
                />
              </div>

              <div>
                <label
                  className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}
                >
                  Email
                </label>
                <input
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="email@pos.com"
                />
              </div>

              <div>
                <label
                  className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}
                >
                  Password
                </label>
                <input
                  className={`w-full ${COMMON_STYLES.input(isDarkMode)}`}
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  className={`text-xs font-medium uppercase mb-1.5 block ${theme.text.secondary}`}
                >
                  Role
                </label>
                <select
                  className={`w-full ${COMMON_STYLES.select(isDarkMode)}`}
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  {availableRoles.includes("cashier") && (
                    <option value="cashier">Cashier</option>
                  )}
                  {availableRoles.includes("manager") && (
                    <option value="manager">Manager</option>
                  )}
                  {availableRoles.includes("admin") && (
                    <option value="admin">Admin</option>
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${theme.button.ghost}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${theme.button.primary}`}
              >
                Create Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}