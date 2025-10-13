
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-md shadow-soft dark:shadow-soft-dark ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
