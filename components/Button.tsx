import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg focus:ring-light-accent dark:focus:ring-dark-accent disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-light-accent hover:bg-light-accent-hover text-white dark:bg-dark-accent dark:hover:bg-dark-accent-hover shadow-md hover:shadow-lg',
    secondary: 'bg-transparent border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary hover:bg-light-surface-2 dark:hover:bg-dark-surface-2 hover:border-light-accent dark:hover:border-dark-accent',
    ghost: 'bg-transparent text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-2 dark:hover:bg-dark-surface-2',
  };

  const sizeClasses = {
    sm: 'h-32 px-16 text-sm',
    md: 'h-40 px-24 text-sm',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;