export default function CommunityLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-muted mb-6" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[200px] rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
