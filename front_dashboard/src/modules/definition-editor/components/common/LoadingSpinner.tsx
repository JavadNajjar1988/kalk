// کامپوننت LoadingSpinner

import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#3B82F6',
  text,
  className = ''
}) => {
  return (
    <div className={`loading-spinner-container ${className}`}>
      <div 
        className={`loading-spinner loading-spinner-${size}`}
        style={{ borderTopColor: color }}
      />
      {text && (
        <div className="loading-spinner-text" style={{ color }}>
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
