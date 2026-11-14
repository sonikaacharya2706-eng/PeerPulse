import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-brand-500 border-t-transparent ${sizeClasses[size] || sizeClasses.md}`}
      />
    </div>
  );
};

export default LoadingSpinner;
