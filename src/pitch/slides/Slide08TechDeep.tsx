const sections = [
  {
    title: 'Saathi Conversation Engine',
    items: [
      'Slot-filling state machine (23 slots, 7 phases)',
      '241 response templates, warm and natural',
      'DistilBERT-NER entity extraction + regex fallback',
      'Voice input: 10 Indian languages via Web Speech API',
    ],
    icon: 'AI',
    color: '#991b1b',
  },
  {
    title: 'Wellbeing Engine',
    items: [
      '8 parameters: commute, hours, mode, salary, air, attrition, heat, cost',
      '35 Indian cities with CoL, PM2.5, WBGT data',
      '12 research papers backing every formula',
      'Relocation penalty from Gallup community wellbeing',
    ],
    icon: 'WB',
    color: '#166534',
  },
  {
    title: 'Offline-First PWA',
    items: [
      'Service Worker (Workbox) precaches all assets',
      'IndexedDB persists resume data and ML models',
      'All AI runs in-browser: ONNX Runtime + Transformers.js v4',
      'WebGPU acceleration, WASM fallback',
    ],
    icon: 'SW',
    color: '#182B49',
  },
  {
    title: 'Deployment & Performance',
    items: [
      'Deployed on Vercel (static, zero server cost)',
      'LCP < 2.5s, INP < 200ms, CLS < 0.1',
      '9-agent DAG with Kahn topological sort',
      'ReAct traces for every agent decision',
    ],
    icon: 'ms',
    color: '#78350f',
  },
];

export function Slide08TechDeep() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 md:p-16"
      style={{ backgroundColor: '#f8fafc', color: '#182B49' }}
    >
      <h2 className="mb-10 text-4xl font-extrabold md:text-5xl">
        Technical Deep-Dive
      </h2>

      <div className="grid max-w-5xl gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <div
            key={s.title}
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#ffffff',
              borderLeft: `4px solid ${s.color}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="rounded px-2 py-1 font-mono text-xs font-bold text-white"
                style={{ backgroundColor: s.color }}
              >
                {s.icon}
              </span>
              <h3 className="text-xl font-bold" style={{ color: '#182B49' }}>
                {s.title}
              </h3>
            </div>
            <ul className="space-y-1.5">
              {s.items.map((item) => (
                <li key={item} className="text-base" style={{ color: '#1e293b' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
