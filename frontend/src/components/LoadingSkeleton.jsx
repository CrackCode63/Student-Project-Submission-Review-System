import { cn } from '../utils/cn';

export function LoadingSkeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-2xl bg-[linear-gradient(110deg,rgba(255,255,255,0.18),rgba(255,255,255,0.36),rgba(255,255,255,0.18))] bg-[length:200%_100%] dark:bg-[linear-gradient(110deg,rgba(51,65,85,0.35),rgba(100,116,139,0.28),rgba(51,65,85,0.35))]',
        className,
      )}
    />
  );
}
