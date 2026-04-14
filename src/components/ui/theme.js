/**
 * Premium Theme Configuration - Clean, Professional, Spacious
 * Designed for better readability and visual hierarchy
 */

export const FONTS = {
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"Geist Mono", "SF Mono", Monaco, Consolas, monospace'
};

export const getTheme = (isDarkMode) => ({
  // Background colors - Clean and spacious
  bg: {
    main: isDarkMode ? 'bg-[#0A0F1C]' : 'bg-[#f1f5f9]',
    card: isDarkMode ? 'bg-[#0F172A]' : 'bg-white',
    hover: isDarkMode ? 'hover:bg-[#1E293B]' : 'hover:bg-[#f8fafc]',
    active: isDarkMode ? 'bg-[#1E293B]' : 'bg-[#e2e8f0]',
    overlay: isDarkMode ? 'bg-[#0A0F1C]/90' : 'bg-[#0f172a]/40',
    input: isDarkMode ? 'bg-[#0F172A]' : 'bg-white',
    subtle: isDarkMode ? 'bg-[#1E293B]/40' : 'bg-[#f8fafc]',
    danger: isDarkMode ? 'bg-[#FF4D4F]/5' : 'bg-red-50',
  },

  // Border colors - Subtle and clean
  border: {
    default: isDarkMode ? 'border-[#1E293B]' : 'border-[#e2e8f0]',
    hover: isDarkMode ? 'hover:border-[#3B82F6]/40' : 'hover:border-[#94a3b8]',
    focus: isDarkMode ? 'focus:border-[#3B82F6]' : 'focus:border-[#3B82F6]',
    light: isDarkMode ? 'border-[#1E293B]/50' : 'border-[#f1f5f9]',
  },

  // Text colors - Clear and readable
  text: {
    main: isDarkMode ? 'text-[#F8FAFC]' : 'text-[#0f172a]',
    secondary: isDarkMode ? 'text-[#94A3B8]' : 'text-[#475569]',
    muted: isDarkMode ? 'text-[#64748B]' : 'text-[#94a3b8]',
    error: isDarkMode ? 'text-[#FF4D4F]' : 'text-red-600',
    warning: isDarkMode ? 'text-[#FFA726]' : 'text-orange-600',
    success: isDarkMode ? 'text-[#22C55E]' : 'text-green-600',
    primary: isDarkMode ? 'text-white' : 'text-[#0f172a]',
    inverse: isDarkMode ? 'text-[#0A0F1C]' : 'text-white',
  },

  // Button styles - Clean and modern
  button: {
    primary: isDarkMode 
      ? 'bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-all duration-200 shadow-sm' 
      : 'bg-[#3B82F6] text-white rounded-xl hover:bg-[#2563EB] transition-all duration-200 shadow-sm',
    secondary: isDarkMode 
      ? 'bg-[#1E293B] text-[#F8FAFC] rounded-xl hover:bg-[#334155] transition-all duration-200' 
      : 'bg-white border border-[#e2e8f0] text-[#0f172a] rounded-xl hover:bg-[#f8fafc] transition-all duration-200',
    ghost: isDarkMode 
      ? 'bg-transparent text-[#94A3B8] rounded-xl hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-all duration-200' 
      : 'bg-transparent text-[#475569] rounded-xl hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-all duration-200',
    danger: isDarkMode 
      ? 'bg-transparent text-[#FF4D4F] rounded-xl hover:bg-[#FF4D4F]/10 transition-all duration-200' 
      : 'bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-200',
  },
});

export const COMMON_STYLES = {
  container: (isDarkMode) => `
    min-h-screen flex flex-col
    ${isDarkMode ? 'bg-[#0A0F1C] text-[#F8FAFC]' : 'bg-[#f1f5f9] text-[#0f172a]'}
  `,

  card: (isDarkMode) => `
    rounded-2xl transition-all duration-200 overflow-hidden
    ${isDarkMode 
      ? 'bg-[#0F172A] border border-[#1E293B]' 
      : 'bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md'
    }
  `,

  input: (isDarkMode) => `
    w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border
    ${isDarkMode 
      ? 'bg-[#0F172A] border-[#1E293B] text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30' 
      : 'bg-white border-[#e2e8f0] text-[#0f172a] placeholder-[#94a3b8] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30'
    }
  `,

  select: (isDarkMode) => `
    w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 outline-none border appearance-none cursor-pointer
    ${isDarkMode 
      ? 'bg-[#0F172A] border-[#1E293B] text-[#F8FAFC] focus:border-[#3B82F6]' 
      : 'bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#3B82F6]'
    }
  `,

  modal: (isDarkMode) => `
    w-full max-w-lg rounded-2xl shadow-xl overflow-hidden
    ${isDarkMode ? 'bg-[#0F172A] border border-[#1E293B]' : 'bg-white border border-[#e2e8f0]'}
  `,

  scrollbar: (isDarkMode) => `
    scrollbar-thin 
    ${isDarkMode 
      ? 'scrollbar-thumb-[#1E293B] scrollbar-track-transparent' 
      : 'scrollbar-thumb-[#cbd5e1] scrollbar-track-transparent'
    }
  `,

  tableRow: (isDarkMode) => `
    transition-all duration-150
    ${isDarkMode 
      ? 'bg-transparent border-b border-[#1E293B] hover:bg-[#1E293B]/50' 
      : 'border-b border-[#f1f5f9] hover:bg-[#f8fafc]'
    }
  `,

  tableHeader: (isDarkMode) => `
    text-xs font-semibold uppercase tracking-wider py-4 px-4
    ${isDarkMode 
      ? 'text-[#94A3B8] bg-[#0F172A] border-b border-[#1E293B]' 
      : 'bg-[#f8fafc] border-b border-[#e2e8f0] text-[#475569]'
    }
  `,

  badge: (isDarkMode) => `
    px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider
    ${isDarkMode 
      ? 'bg-[#1E293B] text-[#94A3B8]' 
      : 'bg-[#f1f5f9] text-[#475569]'
    }
  `,

  icon: (isDarkMode) => isDarkMode ? 'text-[#64748B]' : 'text-[#64748b]',
  
  // Stat Card - For dashboard metrics
  statCard: (isDarkMode) => `
    p-6 rounded-2xl transition-all duration-200
    ${isDarkMode 
      ? 'bg-[#0F172A] border border-[#1E293B] hover:border-[#3B82F6]/30' 
      : 'bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md'
    }
  `,
};

export const ANIMATIONS = {
  fadeIn: 'animate-in fade-in duration-200',
  slideInFromLeft: 'animate-in slide-in-from-left duration-200',
  slideInFromRight: 'animate-in slide-in-from-right duration-200',
  slideInFromBottom: 'animate-in slide-in-from-bottom-2 duration-200',
  zoomIn: 'animate-in zoom-in-95 duration-200',
  scaleDown: 'active:scale-[0.98]',
};