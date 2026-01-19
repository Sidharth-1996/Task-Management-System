import React from 'react';
import Card from './Card';

export const SkeletonCard = () => {
  return (
    <Card>
      <div className="p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
          <div className="w-16 h-4 bg-slate-200 rounded"></div>
        </div>
        <div className="w-24 h-3 bg-slate-200 rounded mb-2"></div>
        <div className="w-16 h-8 bg-slate-200 rounded"></div>
      </div>
    </Card>
  );
};

export const SkeletonTableRow = () => {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-slate-200 rounded mb-2"></div>
            <div className="w-48 h-3 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="w-20 h-6 bg-slate-200 rounded"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;

