import React from 'react';

export const CurrencyDisplay = ({ amount, className = '', showDecimals = false }) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);

  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      {formatted}
    </span>
  );
};
