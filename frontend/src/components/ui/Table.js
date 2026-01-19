import React from 'react';

const Table = ({ children, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-slate-200">
        {children}
      </table>
    </div>
  );
};

const TableHead = ({ children }) => {
  return (
    <thead className="bg-slate-50">
      <tr>{children}</tr>
    </thead>
  );
};

const TableHeader = ({ children, className = '' }) => {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

const TableBody = ({ children }) => {
  return <tbody className="bg-white divide-y divide-slate-200">{children}</tbody>;
};

const TableRow = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`${onClick ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

const TableCell = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-slate-900 ${className}`}>
      {children}
    </td>
  );
};

Table.Head = TableHead;
Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;

export default Table;

