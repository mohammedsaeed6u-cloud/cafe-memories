'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-stone-200/80 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
};

export const MetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-60 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-100">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardPreviewSkeleton: React.FC = () => {
  return (
    <div className="w-[300px] h-[520px] rounded-2xl bg-stone-100 border border-stone-200/80 p-4 space-y-4 flex flex-col items-center justify-between animate-pulse">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <div className="space-y-3 w-full flex flex-col items-center">
        <Skeleton className="w-[240px] h-[100px] rounded-lg" />
        <Skeleton className="w-[240px] h-[100px] rounded-lg" />
        <Skeleton className="w-[240px] h-[100px] rounded-lg" />
      </div>
      <Skeleton className="h-6 w-32 rounded-md" />
    </div>
  );
};
