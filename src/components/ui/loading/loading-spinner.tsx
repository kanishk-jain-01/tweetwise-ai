import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const LoadingSpinner = ({
  className,
  size = 'md',
}: LoadingSpinnerProps) => {
  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
};
