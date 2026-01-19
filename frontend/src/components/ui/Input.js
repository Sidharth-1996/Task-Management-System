import React from 'react';

const Input = ({ 
  label, 
  error,
  required = false,
  multiline = false,
  rows,
  className = '',
  ...props 
}) => {
  const baseClasses = `w-full px-4 py-2.5 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
    error 
      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200' 
      : 'border-slate-300 bg-white hover:border-slate-400 focus:border-primary-500 focus:ring-primary-200'
  } ${className}`;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          className={baseClasses}
          rows={rows || 3}
          {...props}
        />
      ) : (
        <input
          className={baseClasses}
          {...props}
        />
      )}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default Input;

