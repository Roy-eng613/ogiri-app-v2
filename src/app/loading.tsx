export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header skeleton */}
      <div className="site-header">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: "var(--border-subtle)" }} />
          <div className="flex flex-col gap-1">
            <div className="w-32 h-3 rounded animate-pulse" style={{ background: "var(--border-subtle)" }} />
            <div className="w-20 h-2 rounded animate-pulse" style={{ background: "var(--border-subtle)" }} />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Topic card skeleton */}
        <div className="topic-card p-6 md:p-8">
          <div className="flex gap-2 mb-4">
            <div className="w-20 h-5 rounded-full animate-pulse" style={{ background: "rgba(201,160,74,0.2)" }} />
            <div className="w-16 h-5 rounded-full animate-pulse" style={{ background: "var(--border-subtle)" }} />
          </div>
          <div className="w-full h-7 rounded mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="w-3/4 h-7 rounded mb-5 animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-24 h-4 rounded animate-pulse" style={{ background: "var(--border-subtle)" }} />
            ))}
          </div>
        </div>

        {/* Form skeleton */}
        <div className="glass-card p-5">
          <div className="w-40 h-4 rounded mb-3 animate-pulse" style={{ background: "var(--border-subtle)" }} />
          <div className="w-full h-20 rounded-xl animate-pulse" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)" }} />
          <div className="flex justify-end mt-3">
            <div className="w-32 h-10 rounded-xl animate-pulse" style={{ background: "rgba(201,160,74,0.2)" }} />
          </div>
        </div>

        {/* Boke cards skeleton */}
        <div className="divider-label mb-4">
          <span style={{ color: "var(--text-muted)" }}>📜 みんなのボケ</span>
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="boke-card p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: "var(--border-subtle)", flexShrink: 0 }} />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="w-24 h-3 rounded animate-pulse" style={{ background: "var(--border-subtle)" }} />
                  <div className="w-full h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                  <div className="w-2/3 h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
