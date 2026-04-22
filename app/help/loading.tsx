export default function HelpLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-muted mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
