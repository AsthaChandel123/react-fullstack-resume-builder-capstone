export function Slide05DemoBuilder() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 md:p-16"
      style={{ backgroundColor: '#ffffff', color: '#182B49' }}
    >
      <h2 className="mb-2 text-4xl font-extrabold md:text-5xl">
        Saathi Builder
      </h2>
      <p className="mb-10 text-xl font-medium" style={{ color: '#475569' }}>
        Talk. Listen. Build. Print.
      </p>

      <div
        className="flex w-full max-w-5xl overflow-hidden rounded-2xl"
        style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
      >
        {/* Left: chat mockup */}
        <div className="w-1/2 space-y-3 border-r p-6" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
          <div className="flex justify-start">
            <div
              className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: '#182B49', color: '#ffffff' }}
            >
              Hey! I'm Saathi. What's your name?
            </div>
          </div>
          <div className="flex justify-end">
            <div
              className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: '#991b1b', color: '#ffffff' }}
            >
              Priya Sharma
            </div>
          </div>
          <div className="flex justify-start">
            <div
              className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: '#182B49', color: '#ffffff' }}
            >
              Nice to meet you, Priya! Where are you based?
            </div>
          </div>
          <div className="flex justify-end">
            <div
              className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium"
              style={{ backgroundColor: '#991b1b', color: '#ffffff' }}
            >
              Solan, Himachal Pradesh
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <div
              className="flex-1 rounded-full px-4 py-2.5 text-sm"
              style={{ backgroundColor: '#e2e8f0', color: '#475569' }}
            >
              Type or tap mic to speak...
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: '#991b1b' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 7h2v-3.07c3.39-.49 6-3.4 6-6.93h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6H3c0 3.53 2.61 6.44 6 6.93V21z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: preview mockup */}
        <div className="w-1/2 space-y-3 p-6" style={{ backgroundColor: '#ffffff' }}>
          <div className="h-6 w-2/3 rounded" style={{ backgroundColor: '#182B49' }} />
          <div className="h-4 w-1/2 rounded" style={{ backgroundColor: '#e2e8f0' }} />
          <div className="mt-4 space-y-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-3 rounded"
                style={{ backgroundColor: '#e2e8f0', width: `${85 - n * 10}%` }}
              />
            ))}
          </div>
          <div className="mt-6 space-y-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-3 rounded"
                style={{ backgroundColor: '#e2e8f0', width: `${90 - n * 8}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-6 text-lg font-semibold">
        {['Conversational AI', 'Voice in 10 languages', 'Session persistence', 'Real-time preview'].map((f) => (
          <span
            key={f}
            className="rounded-full px-5 py-2"
            style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
