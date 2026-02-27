export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`mx-auto max-w-4xl px-4 py-8 ${className ?? ""}`}>
      {children}
    </main>
  );
}
