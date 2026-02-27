export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-8" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600 dark:border-neutral-700 dark:border-t-neutral-400" />
    </div>
  );
}
