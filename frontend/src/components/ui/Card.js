import React from 'react';

const Card = ({ children, className = '', hover = false, onClick }) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-slate-200';
  const hoverClasses = hover ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300 cursor-pointer' : '';
  const clickClasses = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${clickClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;

