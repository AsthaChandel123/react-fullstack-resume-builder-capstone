export function Slide04Architecture() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-6 md:p-12"
      style={{ backgroundColor: '#ffffff', color: '#182B49' }}
    >
      <h2 className="mb-8 text-4xl font-extrabold md:text-5xl">
        Architecture
      </h2>

      <div className="mb-8 grid w-full max-w-6xl gap-8 md:grid-cols-2">
        {/* Saathi pipeline */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <h3 className="mb-5 text-center text-lg font-bold" style={{ color: '#0f766e' }}>
            Student: Saathi Conversation Engine
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Saathi Chat', desc: 'Slot-filling conversation', accent: '#0f766e' },
              { label: 'Entity Extraction', desc: 'DistilBERT-NER + regex patterns', accent: '#075985' },
              { label: 'Slot Machine', desc: '23 slots, 241 response templates', accent: '#4338ca' },
              { label: 'Resume Generator', desc: 'Live preview, 4 ATS templates', accent: '#6d28d9' },
            ].map((node, i) => (
              <div key={node.label} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: node.accent }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: node.accent }}>
                    {node.label}
                  </div>
                  <div className="text-xs font-medium" style={{ color: '#475569' }}>
                    {node.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DAG pipeline */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <h3 className="mb-5 text-center text-lg font-bold" style={{ color: '#9a3412' }}>
            Employer: 9-Agent DAG Pipeline
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Parallel Start', desc: 'JD Agent + L1 NLP + L2 Embed + Distance', accent: '#9a3412' },
              { label: 'Converge', desc: 'Skills Matcher + L3 Gemma 4 E2B', accent: '#92400e' },
              { label: 'Fallback', desc: 'L4 Gemini 2.5 Flash (if L3 fails)', accent: '#78350f' },
              { label: 'Output', desc: 'Scorer + Coach with ReAct traces', accent: '#713f12' },
            ].map((node, i) => (
              <div key={node.label} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: node.accent }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: node.accent }}>
                    {node.label}
                  </div>
                  <div className="text-xs font-medium" style={{ color: '#475569' }}>
                    {node.desc}
                  </div>
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
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
            }}
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
