import React from 'react';
import { Inbox, User, Folder } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = Inbox,
  title = 'No data available',
  description = 'There is nothing to display here.',
  action,
  className = '',
  showPersonFolder = false
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {showPersonFolder ? (
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-3">
            <User className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100">
            <Folder className="h-6 w-6 text-slate-400" strokeWidth={1.5} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
          <Icon className="h-10 w-10 text-slate-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-6 text-center max-w-md">{description}</p>
      {action && action}
    </div>
  );
};

export default EmptyState;

