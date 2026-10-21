import { Loader2 } from 'lucide-react';

/** Full-page spinner */
export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm text-surface-400">Loading...</p>
      </div>
    </div>
  );
}

/** Inline spinner */
export function Spinner({ size = 'md', className = 'text-primary-500' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <Loader2 className={`${sizes[size]} animate-spin ${className}`} />;
}

/** Skeleton loader block */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface-200 rounded-lg animate-pulse ${className}`} />
  );
}

/** Card skeleton */
export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** Table skeleton */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Empty state */
export function EmptyState({ message = 'No data found', icon: Icon }: { message?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-surface-400">
      {Icon && <Icon className="w-12 h-12 mb-3 text-surface-300" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
