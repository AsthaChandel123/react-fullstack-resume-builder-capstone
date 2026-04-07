export function Slide04Architecture() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-6 md:p-12"
      style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
    >
      <h2 className="mb-8 text-4xl font-extrabold md:text-5xl">
        Architecture
      </h2>

      {/* Two pipelines side by side */}
      <div className="mb-8 grid w-full max-w-6xl gap-8 md:grid-cols-2">

        {/* Saathi pipeline */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <h3 className="mb-5 text-center text-lg font-bold" style={{ color: '#2dd4bf' }}>
            Student: Saathi Conversation Engine
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Saathi Chat', desc: 'Slot-filling conversation', accent: '#2dd4bf' },
              { label: 'Entity Extraction', desc: 'DistilBERT-NER + regex patterns', accent: '#38bdf8' },
              { label: 'Slot Machine', desc: '24 slots, 241 response templates', accent: '#818cf8' },
              { label: 'Resume Generator', desc: 'Live preview, 4 ATS templates', accent: '#a78bfa' },
            ].map((node, i) => (
              <div key={node.label} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: node.accent, color: '#0f172a' }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: node.accent }}>{node.label}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{node.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DAG pipeline */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <h3 className="mb-5 text-center text-lg font-bold" style={{ color: '#f97316' }}>
            Employer: 9-Agent DAG Pipeline
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Parallel Start', desc: 'JD Agent + L1 NLP + L2 Embed + Distance', accent: '#f97316' },
              { label: 'Converge', desc: 'Skills Matcher + L3 Gemma 4 E2B', accent: '#fb923c' },
              { label: 'Fallback', desc: 'L4 Gemini 2.5 Flash (if L3 fails)', accent: '#fbbf24' },
              { label: 'Output', desc: 'Scorer + Coach with ReAct traces', accent: '#fde68a' },
            ].map((node, i) => (
              <div key={node.label} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: node.accent, color: '#0f172a' }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: node.accent }}>{node.label}</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{node.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          'Vite 6', 'React 19', 'Tailwind CSS 4', 'Zustand', 'ONNX Runtime',
          'Transformers.js v4', 'Firebase', 'Workbox PWA',
        ].map((tech) => (
          <span
            key={tech}
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
