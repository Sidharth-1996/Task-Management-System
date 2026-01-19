import React from 'react';

const Select = ({ 
  label, 
  error,
  required = false,
  options = [],
  className = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
          error 
            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-200' 
            : 'border-slate-300 bg-white hover:border-slate-400 focus:border-primary-500 focus:ring-primary-200'
        } ${className}`}
        {...props}
      >
        {options.length > 0 ? (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          props.children
        )}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Select;

