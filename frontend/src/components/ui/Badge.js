import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '' 
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-teal-100 text-teal-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    active: 'bg-teal-100 text-teal-700',
    inactive: 'bg-slate-100 text-slate-500',
    'on-leave': 'bg-amber-100 text-amber-700',
    pending: 'bg-amber-100 text-amber-700',
    processed: 'bg-primary-100 text-primary-700',
    paid: 'bg-teal-100 text-teal-700',
    draft: 'bg-slate-100 text-slate-600',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;

