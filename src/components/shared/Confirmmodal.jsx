// components/ui/ConfirmModal.jsx
// Drop-in replacement for window.confirm / alert / prompt
// Usage examples at bottom of this file

import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, Info, CheckCircle, X } from "lucide-react";

const ICONS = {
  danger:  { icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  info:    { icon: Info,          color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
  success: { icon: CheckCircle,   color: "#10b981", bg: "rgba(16,185,129,0.08)" },
};

// ── Primitive modal shell ─────────────────────────────────────────────────────
function ModalShell({ isDarkMode, onClose, children }) {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const bg   = isDarkMode ? "#0f0f0f" : "#ffffff";
  const bord = isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        padding: "1rem",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div style={{
        background: bg, borderRadius: "1rem", border: `1px solid ${bord}`,
        boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
        width: "100%", maxWidth: "420px",
        overflow: "hidden",
        animation: "zoomIn 0.15s ease",
      }}>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn  { from{opacity:0}  to{opacity:1}  }
        @keyframes zoomIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}

// ── Confirm Modal (replaces window.confirm) ───────────────────────────────────
export function ConfirmModal({
  open, onClose, onConfirm,
  title = "Are you sure?",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",   // danger | warning | info | success
  isDarkMode = true,
}) {
  if (!open) return null;
  const { icon: Icon, color, bg } = ICONS[variant] || ICONS.danger;
  const textMain  = isDarkMode ? "#f5f5f5" : "#1a1a1a";
  const textMuted = isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const btnBg     = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <ModalShell isDarkMode={isDarkMode} onClose={onClose}>
      {/* Header */}
      <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ padding: "0.65rem", borderRadius: "0.75rem", background: bg, flexShrink: 0 }}>
          <Icon size={22} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: textMain }}>{title}</h3>
          {message && <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: textMuted, lineHeight: 1.55 }}>{message}</p>}
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: textMuted, padding: "2px", flexShrink: 0 }}>
          <X size={18} />
        </button>
      </div>
      {/* Footer */}
      <div style={{ padding: "0.75rem 1.5rem 1.25rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{
          padding: "0.6rem 1.2rem", borderRadius: "0.6rem", border: "1px solid",
          borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)",
          background: btnBg, color: textMuted, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
        }}>
          {cancelLabel}
        </button>
        <button onClick={() => { onConfirm(); onClose(); }} style={{
          padding: "0.6rem 1.4rem", borderRadius: "0.6rem", border: "none",
          background: color, color: "#fff", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
          transition: "opacity 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Alert Modal (replaces window.alert) ──────────────────────────────────────
export function AlertModal({
  open, onClose,
  title = "Notice",
  message = "",
  variant = "info",
  isDarkMode = true,
}) {
  if (!open) return null;
  const { icon: Icon, color, bg } = ICONS[variant] || ICONS.info;
  const textMain  = isDarkMode ? "#f5f5f5" : "#1a1a1a";
  const textMuted = isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  return (
    <ModalShell isDarkMode={isDarkMode} onClose={onClose}>
      <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ padding: "0.65rem", borderRadius: "0.75rem", background: bg, flexShrink: 0 }}>
          <Icon size={22} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: textMain }}>{title}</h3>
          {message && <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: textMuted, lineHeight: 1.55 }}>{message}</p>}
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: textMuted, padding: "2px" }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: "0.75rem 1.5rem 1.25rem", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{
          padding: "0.6rem 1.6rem", borderRadius: "0.6rem", border: "none",
          background: color, color: "#fff", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
        }}>
          OK
        </button>
      </div>
    </ModalShell>
  );
}

// ── Prompt Modal (replaces window.prompt) ────────────────────────────────────
export function PromptModal({
  open, onClose, onSubmit,
  title = "Enter a value",
  message = "",
  placeholder = "",
  submitLabel = "Submit",
  inputType = "text",     // text | number
  variant = "info",
  isDarkMode = true,
}) {
  const [value, setValue] = useState("");
  useEffect(() => { if (open) setValue(""); }, [open]);
  if (!open) return null;

  const { icon: Icon, color, bg } = ICONS[variant] || ICONS.info;
  const textMain  = isDarkMode ? "#f5f5f5" : "#1a1a1a";
  const textMuted = isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const inputBg   = isDarkMode ? "#1a1a1a" : "#f8f8f8";
  const inputBord = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)";
  const btnBg     = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    onClose();
  };

  return (
    <ModalShell isDarkMode={isDarkMode} onClose={onClose}>
      <div style={{ padding: "1.5rem 1.5rem 1rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ padding: "0.65rem", borderRadius: "0.75rem", background: bg, flexShrink: 0 }}>
          <Icon size={22} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: textMain }}>{title}</h3>
          {message && <p style={{ margin: "0.4rem 0 0", fontSize: "0.82rem", color: textMuted, lineHeight: 1.55 }}>{message}</p>}
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: textMuted, padding: "2px" }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: "0 1.5rem 0.5rem" }}>
        <input
          autoFocus
          type={inputType}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box",
            background: inputBg, border: `1px solid ${inputBord}`,
            color: textMain, padding: "0.75rem 1rem",
            borderRadius: "0.6rem", outline: "none", fontSize: "0.9rem",
          }}
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e => e.target.style.borderColor = inputBord}
        />
      </div>
      <div style={{ padding: "0.75rem 1.5rem 1.25rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{
          padding: "0.6rem 1.2rem", borderRadius: "0.6rem", border: "1px solid",
          borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)",
          background: btnBg, color: textMuted, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
        }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={!value.trim()} style={{
          padding: "0.6rem 1.4rem", borderRadius: "0.6rem", border: "none",
          background: value.trim() ? color : (isDarkMode ? "#333" : "#ccc"),
          color: "#fff", fontSize: "0.82rem", fontWeight: 700,
          cursor: value.trim() ? "pointer" : "not-allowed",
          transition: "background 0.15s",
        }}>
          {submitLabel}
        </button>
      </div>
    </ModalShell>
  );
}

/*
USAGE EXAMPLES
==============

// Replace: if (confirm("Delete?")) handleDelete(id);
// With:
const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
<ConfirmModal
  open={confirmDelete.open}
  onClose={() => setConfirmDelete({ open: false, id: null })}
  onConfirm={() => handleDelete(confirmDelete.id)}
  title="Delete staff member?"
  message="This action cannot be undone."
  confirmLabel="Delete"
  variant="danger"
  isDarkMode={isDarkMode}
/>
// Trigger: setConfirmDelete({ open: true, id: user.id })

// Replace: alert("Everything is fully stocked.");
// With:
const [alertModal, setAlertModal] = useState({ open: false, title: "", message: "", variant: "info" });
<AlertModal
  open={alertModal.open}
  onClose={() => setAlertModal(a => ({ ...a, open: false }))}
  title={alertModal.title}
  message={alertModal.message}
  variant={alertModal.variant}
  isDarkMode={isDarkMode}
/>
// Trigger: setAlertModal({ open: true, title: "All Good", message: "Everything is fully stocked.", variant: "success" })

// Replace: const amount = prompt("Quantity to add:");
// With:
const [promptModal, setPromptModal] = useState({ open: false, itemId: null });
<PromptModal
  open={promptModal.open}
  onClose={() => setPromptModal({ open: false, itemId: null })}
  onSubmit={(val) => handleRestock(promptModal.itemId, val)}
  title="Restock Ingredient"
  message="Enter quantity to add to current stock."
  placeholder="e.g. 50"
  submitLabel="Add Stock"
  inputType="number"
  variant="info"
  isDarkMode={isDarkMode}
/>
// Trigger: setPromptModal({ open: true, itemId: item.id })
*/