import React from 'react';

const Logo = ({ variant = 'default', className = '' }) => {
  const isCompact = variant === 'compact';
  const isSidebar = variant === 'sidebar';
  const isAuth = variant === 'auth';
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-shrink-0">
        <svg
          width={isCompact ? "32" : isSidebar ? "32" : isAuth ? "48" : "36"}
          height={isCompact ? "32" : isSidebar ? "32" : isAuth ? "48" : "36"}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 2L6 8V18C6 26.5 12 33.5 20 38C28 33.5 34 26.5 34 18V8L20 2Z"
            fill={isSidebar ? "#ffffff" : "#1e40af"}
            stroke={isSidebar ? "#ffffff" : "#1e3a8a"}
            strokeWidth="0.5"
          />
          
          <path
            d="M20 6L10 10V18C10 24.5 14.5 29.5 20 33C25.5 29.5 30 24.5 30 18V10L20 6Z"
            fill={isSidebar ? "#2dd4bf" : "#14b8a6"}
            opacity={isSidebar ? "0.4" : "0.25"}
          />
          
          <path
            d="M20 9L13 11.5V18C13 22.5 16 26 20 28.5C24 26 27 22.5 27 18V11.5L20 9Z"
            fill={isSidebar ? "#14b8a6" : "#0d9488"}
            opacity={isSidebar ? "0.5" : "0.35"}
          />
          
          <path
            d="M20 12L16 13.5V18C16 20.5 17.5 22.5 20 23.5C22.5 22.5 24 20.5 24 18V13.5L20 12Z"
            fill={isSidebar ? "#0d9488" : "#2dd4bf"}
            opacity={isSidebar ? "0.6" : "0.45"}
          />
          
          <path
            d="M18 16L20 14L22 16L20 18L18 16Z"
            fill={isSidebar ? "#2dd4bf" : "#14b8a6"}
            opacity="0.8"
          />
          <path
            d="M16 18L18 16L20 18L18 20L16 18Z"
            fill={isSidebar ? "#0d9488" : "#2dd4bf"}
            opacity="0.6"
          />
          <path
            d="M22 18L24 16L26 18L24 20L22 18Z"
            fill={isSidebar ? "#0d9488" : "#2dd4bf"}
            opacity="0.6"
          />
          
          <path
            d="M19 19H21V21H19V19Z"
            fill={isSidebar ? "#ffffff" : "#ffffff"}
            opacity="0.9"
          />
        </svg>
      </div>
      
      {!isCompact && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-baseline gap-1">
            <span className={`${isAuth ? 'text-2xl' : 'text-lg'} font-bold tracking-tight ${isSidebar ? 'text-white' : 'text-slate-900'}`}>
              WorkForge
            </span>
            <span className={`${isAuth ? 'text-2xl' : 'text-lg'} font-bold tracking-tight ${isSidebar ? 'text-teal-400' : 'text-teal-600'}`}>
              HR
            </span>
          </div>
          <p className={`${isAuth ? 'text-xs' : 'text-[10px]'} -mt-0.5 leading-tight font-normal ${isSidebar ? 'text-slate-300' : isAuth ? 'text-slate-600' : 'text-slate-500'}`}>
            Employee Management, Refined.
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;

