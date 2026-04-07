const dagNodes = [
  {
    id: 'parallel',
    label: 'Parallel Start',
    nodes: ['JD Agent', 'L1 NLP', 'L2 Embed', 'Distance'],
    color: '#e41a1a',
  },
  {
    id: 'converge1',
    label: 'After JD + L1',
    nodes: ['Skills Matcher', 'L3 Gemma 4 E2B'],
    color: '#d4a800',
  },
  {
    id: 'fallback',
    label: 'If L3 fails',
    nodes: ['L4 Gemini Fallback'],
    color: '#666666',
  },
  {
    id: 'converge2',
    label: 'Converge',
    nodes: ['Scorer', 'Coach'],
    color: '#182B49',
  },
];

const saathiFlow = [
  { label: 'Saathi Chat', desc: 'Slot-filling conversation', color: '#e41a1a' },
  { label: 'Entity Extraction', desc: 'DistilBERT-NER + regex', color: '#d4a800' },
  { label: 'Slot Machine', desc: '24 slots, 220+ templates', color: '#22c55e' },
  { label: 'Resume Generator', desc: 'Live preview output', color: '#182B49' },
];

const stack = [
  'Vite 6',
  'React 19',
  'Tailwind CSS 4',
  'Zustand',
  'ONNX Runtime',
  'Transformers.js v4',
  'Workbox PWA',
];

export function Slide04Architecture() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-6 md:p-12"
      style={{ backgroundColor: '#182B49', color: '#ffffff' }}
    >
      <h2 className="mb-6 text-4xl font-extrabold md:text-5xl">
        Architecture
      </h2>

      {/* Saathi pipeline */}
      <div className="mb-6 w-full max-w-5xl">
        <h3 className="mb-3 text-center text-lg font-bold opacity-80">Student: Saathi Conversation Engine</h3>
        <div className="flex flex-wrap items-center justify-center gap-0">
          {saathiFlow.map((node, i) => (
            <div key={node.label} className="flex items-center">
              <div
                className="flex flex-col items-center rounded-lg px-4 py-3 text-center shadow-lg"
                style={{ backgroundColor: node.color, minWidth: 150 }}
              >
                <span className="text-sm font-bold">{node.label}</span>
                <span className="mt-0.5 text-xs opacity-80">{node.desc}</span>
              </div>
              {i < saathiFlow.length - 1 && (
                <svg width="24" height="20" viewBox="0 0 24 20" className="mx-1 flex-shrink-0" aria-hidden="true">
                  <path d="M4 10H18M18 10L13 5M18 10L13 15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DAG pipeline */}
      <div className="mb-6 w-full max-w-5xl">
        <h3 className="mb-3 text-center text-lg font-bold opacity-80">Employer: 9-Agent DAG Pipeline</h3>
        <div className="flex flex-wrap items-center justify-center gap-0">
          {dagNodes.map((group, i) => (
            <div key={group.id} className="flex items-center">
              <div
                className="flex flex-col items-center rounded-lg px-4 py-3 text-center shadow-lg"
                style={{ backgroundColor: group.color, minWidth: 160 }}
              >
                <span className="text-xs font-semibold opacity-70">{group.label}</span>
                <span className="mt-0.5 text-sm font-bold">{group.nodes.join(', ')}</span>
              </div>
              {i < dagNodes.length - 1 && (
                <svg width="24" height="20" viewBox="0 0 24 20" className="mx-1 flex-shrink-0" aria-hidden="true">
                  <path d="M4 10H18M18 10L13 5M18 10L13 15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="flex flex-wrap justify-center gap-3">
        {stack.map((tech) => (
          <span
            key={tech}
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}
