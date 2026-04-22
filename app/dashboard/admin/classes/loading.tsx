export default function AdminClassesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-2xl bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[110px] rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-[520px] rounded-2xl bg-muted" />
    </div>
  );
}
