export function Slide03Solution() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 md:p-16"
      style={{ backgroundColor: '#f8fafc', color: '#182B49' }}
    >
      <h2 className="mb-12 text-4xl font-extrabold md:text-5xl">
        The Solution
      </h2>

      <div className="mb-8 grid max-w-5xl gap-8 md:grid-cols-2">
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#ffffff', borderTop: '4px solid #991b1b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        >
          <div
            className="mb-4 inline-block rounded-lg px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: '#991b1b' }}
          >
            Talk to Saathi
          </div>
          <h3 className="mb-3 text-2xl font-bold" style={{ color: '#182B49' }}>
            Conversational resume building
          </h3>
          <ul className="space-y-2 text-lg" style={{ color: '#1e293b' }}>
            <li>Chat-first builder, no forms</li>
            <li>Voice input in 10 Indian languages</li>
            <li>Wellbeing score for every job offer</li>
            <li>Session persistence across visits</li>
          </ul>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#ffffff', borderTop: '4px solid #182B49', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
        >
          <div
            className="mb-4 inline-block rounded-lg px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: '#182B49' }}
          >
            9-Agent Agentic Pipeline
          </div>
          <h3 className="mb-3 text-2xl font-bold" style={{ color: '#182B49' }}>
            DAG-based candidate analysis
          </h3>
          <ul className="space-y-2 text-lg" style={{ color: '#1e293b' }}>
            <li>186-skill taxonomy with graph matching</li>
            <li>JD processing, L1-L4 analysis in parallel</li>
            <li>ReAct traces for every scoring decision</li>
            <li>Red flag and contradiction detection</li>
          </ul>
        </div>
      </div>

      <div
        className="mb-4 rounded-xl px-8 py-4 text-center text-lg font-semibold text-white"
        style={{ backgroundColor: '#182B49' }}
      >
        Bridge: trust layer with signed scorecards between students and employers
      </div>

      <div
        className="rounded-xl px-8 py-4 text-center text-lg font-semibold"
        style={{ backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1' }}
      >
        100% offline after first load. In-browser AI. No data leaves your device.
      </div>
    </div>
  );
}
