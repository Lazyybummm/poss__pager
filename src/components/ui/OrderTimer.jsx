// OrderTimer.jsx
import React, { useState, useEffect } from 'react';
import { getTheme } from "./theme";

const OrderTimer = ({ startedAt, large = false, isDarkMode = true }) => {
  const [elapsed, setElapsed] = useState(0);
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');
  
  // Semantic theme colors based on threshold
  const colorClass = mins > 15 
    ? theme.text.error 
    : mins > 10 
      ? theme.text.warning 
      : theme.text.secondary;
      
  // Responsive text scaling optimized for POS
  const sizeClass = large 
    ? 'text-base sm:text-lg md:text-xl' 
    : 'text-[10px] sm:text-xs md:text-sm';

  return (
    <span className={`font-mono font-bold tracking-tight transition-colors duration-300 ${colorClass} ${sizeClass}`}>
      {mins}:{secs}
    </span>
  );
};

export default OrderTimer;