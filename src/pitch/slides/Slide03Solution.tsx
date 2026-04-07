export function Slide03Solution() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 md:p-16"
      style={{ backgroundColor: '#f5f5f5', color: '#182B49' }}
    >
      <h2 className="mb-12 text-4xl font-extrabold md:text-5xl">
        The Solution
      </h2>

      <div className="mb-8 grid max-w-5xl gap-8 md:grid-cols-2">
        {/* Student card */}
        <div
          className="rounded-2xl p-8 shadow-xl"
          style={{ backgroundColor: '#ffffff', borderTop: '4px solid #e41a1a' }}
        >
          <div
            className="mb-4 inline-block rounded-lg px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: '#e41a1a' }}
          >
            Talk to Saathi
          </div>
          <h3 className="mb-3 text-2xl font-bold">
            Conversational resume building
          </h3>
          <ul className="space-y-2 text-lg" style={{ color: '#333333' }}>
            <li>Chat-first builder, no forms</li>
            <li>Voice input in 10 Indian languages</li>
            <li>Wellbeing score for every job offer</li>
            <li>Session persistence across visits</li>
          </ul>
        </div>

        {/* Employer card */}
        <div
          className="rounded-2xl p-8 shadow-xl"
          style={{ backgroundColor: '#ffffff', borderTop: '4px solid #182B49' }}
        >
          <div
            className="mb-4 inline-block rounded-lg px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: '#182B49' }}
          >
            9-Agent Agentic Pipeline
          </div>
          <h3 className="mb-3 text-2xl font-bold">
            DAG-based candidate analysis
          </h3>
          <ul className="space-y-2 text-lg" style={{ color: '#333333' }}>
            <li>189-skill taxonomy with graph matching</li>
            <li>JD processing, L1-L4 analysis in parallel</li>
            <li>ReAct traces for every scoring decision</li>
            <li>Red flag and contradiction detection</li>
          </ul>
        </div>
      </div>

      {/* Bridge */}
      <div
        className="mb-4 rounded-xl px-8 py-4 text-center text-lg font-semibold text-white"
        style={{ backgroundColor: '#2a4a7a' }}
      >
        Bridge: trust layer with signed scorecards between students and employers
      </div>

      <div
        className="rounded-xl px-8 py-4 text-center text-lg font-semibold text-white"
        style={{ backgroundColor: '#182B49' }}
      >
        100% offline after first load. In-browser AI. No data leaves your device.
      </div>
    </div>
  );
}
