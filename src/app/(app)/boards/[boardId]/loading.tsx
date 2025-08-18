export default function LoadingBoard() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-3 h-4 w-32 rounded bg-muted" />
            <div className="space-y-2">
              {[...Array(3)].map((__, j) => (
                <div key={j} className="h-16 rounded-md border bg-background" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
