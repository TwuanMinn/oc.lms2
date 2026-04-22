export default function AdminAnnouncementsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[120px] rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-[420px] rounded-2xl bg-muted" />
    </div>
  );
}
