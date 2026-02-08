import React from 'react';

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const progress = (current / total) * 100;
  
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">
        <span>Progress</span>
        <span>{current} / {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
