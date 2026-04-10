/**
 * Vercel-inspired Theme Configuration
 * Monochromatic design system with Geist font family
 */

export const FONTS = {
  sans: '-apple-system, "Segoe UI", "Geist Sans", sans-serif',
  mono: '"Geist Mono", "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
};

export const getTheme = (isDarkMode) => ({
  // Background colors
  bg: {
    main: isDarkMode ? "bg-[#000000]" : "bg-white",
    card: isDarkMode ? "bg-[#000000]" : "bg-white",
    hover: isDarkMode ? "hover:bg-[#1a1a1a]" : "hover:bg-neutral-50",
    active: isDarkMode ? "bg-[#1a1a1a]" : "bg-neutral-100",
    overlay: "bg-black/60 backdrop-blur-sm",
    input: isDarkMode ? "bg-[#000000]" : "bg-white",
    subtle: isDarkMode ? "bg-[#002366]" : "bg-neutral-50",
  },

  // Border colors
  border: {
    default: isDarkMode ? "border-[#002366]" : "border-neutral-200",
    hover: isDarkMode ? "hover:border-[#003388]" : "hover:border-neutral-300",
    focus: isDarkMode ? "focus:border-[#002366]" : "focus:border-neutral-400",
    light: isDarkMode ? "border-[#001a4d]" : "border-neutral-100",
  },

  // Text colors
  text: {
    main: isDarkMode ? "text-[#FFFFF0]" : "text-black",
    secondary: isDarkMode ? "text-[#FFFFF0]/70" : "text-neutral-600",
    tertiary: isDarkMode ? "text-[#FFFFF0]/60" : "text-neutral-500",
    muted: isDarkMode ? "text-[#FFFFF0]/50" : "text-neutral-400",
    placeholder: isDarkMode
      ? "placeholder:text-[#FFFFF0]/40"
      : "placeholder:text-neutral-400",
    highlight: isDarkMode ? "text-[#002366]" : "text-black",
  },

  // Button variants
  button: {
    primary: isDarkMode
      ? "bg-[#002366] text-[#FFFFF0] hover:bg-[#003388]"
      : "bg-black text-white hover:bg-neutral-800",
    secondary: isDarkMode
      ? "bg-[#001a4d] text-[#FFFFF0] hover:bg-[#002366]"
      : "bg-neutral-100 text-black hover:bg-neutral-200",
    ghost: isDarkMode
      ? "text-[#FFFFF0] hover:bg-[#002366]/20 hover:text-[#FFFFF0]"
      : "text-neutral-600 hover:bg-neutral-50 hover:text-black",
    icon: isDarkMode
      ? "text-[#002366] hover:bg-[#002366]/10"
      : "text-neutral-600 hover:bg-neutral-100",
  },

  // Ring colors for focus states
  ring: (isDarkMode) =>
    isDarkMode
      ? "focus:ring-1 focus:ring-[#002366]"
      : "focus:ring-1 focus:ring-neutral-400",
});

// Common CSS classes
export const COMMON_STYLES = {
  // Input fields
  input: (isDarkMode) => `
    border px-3 py-2 rounded-md text-sm outline-none
    transition-colors
    ${
      isDarkMode
        ? "bg-[#000000] border-[#002366] text-[#FFFFF0] placeholder:text-[#FFFFF0]/40 focus:border-[#003388]"
        : "bg-white border-neutral-200 text-black placeholder:text-neutral-400 focus:border-neutral-400"
    }
  `,

  // Select dropdowns
  select: (isDarkMode) => `
    border px-3 py-2 rounded-md text-sm outline-none
    appearance-none cursor-pointer transition-colors
    ${
      isDarkMode
        ? "bg-[#000000] border-[#002366] text-[#FFFFF0] focus:border-[#003388]"
        : "bg-white border-neutral-200 text-black focus:border-neutral-400"
    }
  `,

  // Card containers
  card: (isDarkMode) => `
    rounded-lg border
    ${
      isDarkMode
        ? "bg-[#000000] border-[#002366] text-[#FFFFF0]"
        : "bg-white border-neutral-200"
    }
  `,

  // Modal/Overlay containers
  modal: (isDarkMode) => `
    rounded-2xl border shadow-2xl
    ${
      isDarkMode ? "bg-black border-neutral-800" : "bg-white border-neutral-200"
    }
  `,

  // Table rows
  tableRow: (isDarkMode) => `
    border-b text-sm transition-colors
    ${
      isDarkMode
        ? "border-neutral-800 hover:bg-neutral-900"
        : "border-neutral-100 hover:bg-neutral-50"
    }
  `,

  // Table headers
  tableHeader: (isDarkMode) => `
    border-b text-sm
    ${
      isDarkMode
        ? "border-neutral-800 text-neutral-400"
        : "border-neutral-200 text-neutral-600"
    }
  `,

  // Badge/Tag
  badge: (isDarkMode) => `
    px-2 py-1 rounded text-xs font-medium
    ${
      isDarkMode
        ? "bg-neutral-900 text-neutral-400 border border-neutral-800"
        : "bg-neutral-100 text-neutral-600"
    }
  `,

  // Icon colors
  icon: (isDarkMode) => (isDarkMode ? "text-[#002366]" : "text-neutral-400"),
};

// Animation classes
export const ANIMATIONS = {
  fadeIn: "animate-in fade-in duration-200",
  slideInFromLeft: "animate-in slide-in-from-left duration-300",
  slideInFromRight: "animate-in slide-in-from-right duration-300",
  slideInFromTop: "animate-in slide-in-from-top-2 duration-300",
  zoomIn: "animate-in zoom-in-95 duration-200",
  scaleDown: "active:scale-[0.98]",
};

// Transition classes
export const TRANSITIONS = {
  colors: "transition-colors",
  all: "transition-all",
  transform: "transition-transform",
};

// Shadow styles (minimal, Vercel-style)
export const SHADOWS = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
};
