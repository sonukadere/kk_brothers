import React from 'react';
import { Loader2 } from 'lucide-react';

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
};

export const LoadingSpinner = ({ size = 'md', text, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-indigo-600`} />
      {text && <p className="text-xs font-medium text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
