const sections = [
  {
    title: 'Saathi Conversation Engine',
    items: [
      'Slot-filling state machine (24 slots, 5 phases)',
      '220+ response templates, warm and natural',
      'DistilBERT-NER entity extraction + regex fallback',
      'Voice input: 10 Indian languages via Web Speech API',
    ],
    icon: '[ AI ]',
    color: '#e41a1a',
  },
  {
    title: 'Wellbeing Engine',
    items: [
      '8 parameters: commute, hours, mode, salary, air, attrition, heat, cost',
      '35 Indian cities with CoL, PM2.5, WBGT data',
      '13 research papers backing every formula',
      'Relocation penalty from Gallup community wellbeing',
    ],
    icon: '[ WB ]',
    color: '#22c55e',
  },
  {
    title: 'Offline-First PWA',
    items: [
      'Service Worker (Workbox) precaches all assets',
      'IndexedDB persists resume data and ML models',
      'All AI runs in-browser: ONNX Runtime + Transformers.js v4',
      'WebGPU acceleration, WASM fallback',
    ],
    icon: '[ SW ]',
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
    icon: '[ ms ]',
    color: '#d4a800',
  },
];

export function Slide08TechDeep() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 md:p-16"
      style={{ backgroundColor: '#182B49', color: '#ffffff' }}
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
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderLeft: `4px solid ${s.color}`,
            }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="rounded px-2 py-1 font-mono text-xs font-bold"
                style={{ backgroundColor: s.color, color: '#ffffff' }}
              >
                {s.icon}
              </span>
              <h3 className="text-xl font-bold">{s.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {s.items.map((item) => (
                <li
                  key={item}
                  className="text-base"
                  style={{ color: 'rgba(255, 255, 255, 0.85)' }}
                >
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
