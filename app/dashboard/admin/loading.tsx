export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-36 rounded-2xl bg-muted" />
      {/* Bento grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[140px] rounded-2xl bg-muted" />
        ))}
      </div>
      {/* Activity feed skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-[300px] rounded-2xl bg-muted" />
        <div className="h-[300px] rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
