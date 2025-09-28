// کامپوننت EmptyState

import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  action,
  size = 'medium',
  className = ''
}) => {
  return (
    <div className={`empty-state empty-state-${size} ${className}`}>
      <div className="empty-state-content">
        {icon && (
          <div className="empty-state-icon">
            {icon}
          </div>
        )}
        <h3 className="empty-state-title">
          {title}
        </h3>
        {description && (
          <p className="empty-state-description">
            {description}
          </p>
        )}
        {action && (
          <div className="empty-state-action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
