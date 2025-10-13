
import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => {
  return (
    <div className={`animate-pulse bg-light-surface-2 dark:bg-dark-surface-2 rounded-md ${className}`}></div>
  );
};

export const ProblemSkeleton: React.FC = () => (
    <div className="p-24 space-y-24">
        <div className="flex justify-between items-start">
            <div className="space-y-8 w-2/3">
                <SkeletonLoader className="h-24 w-3/4" />
                <SkeletonLoader className="h-16 w-1/2" />
            </div>
            <SkeletonLoader className="h-24 w-1/4" />
        </div>
        <div className="space-y-16">
            <SkeletonLoader className="h-16 w-full" />
            <SkeletonLoader className="h-16 w-full" />
            <SkeletonLoader className="h-16 w-5/6" />
        </div>
        <div className="space-y-16">
            <SkeletonLoader className="h-24 w-1/3" />
            <div className="p-16 bg-light-surface-2 dark:bg-dark-surface-2 rounded-md space-y-8">
                <SkeletonLoader className="h-16 w-full" />
                <SkeletonLoader className="h-16 w-1/2" />
            </div>
        </div>
    </div>
);


export default SkeletonLoader;
