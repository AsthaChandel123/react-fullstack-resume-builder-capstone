export function Slide01Title() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 text-center"
      style={{ backgroundColor: '#f8fafc', color: '#182B49' }}
    >
      <div className="mb-8 rounded-xl bg-white p-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <img
          src="/assets/images/shoolini-logo.png"
          alt="Shoolini University logo"
          className="h-20 w-auto"
          crossOrigin="anonymous"
        />
      </div>
      <h1 className="mb-6 text-6xl font-extrabold tracking-tight md:text-7xl" style={{ color: '#182B49' }}>
        ResumeAI
      </h1>
      <p className="mb-2 text-2xl font-semibold" style={{ color: '#1e293b' }}>
        Astha Chandel
      </p>
      <p className="text-xl font-medium" style={{ color: '#334155' }}>
        GF202214559
      </p>
      <p className="mt-4 text-lg" style={{ color: '#475569' }}>
        BTech CSE Final Semester Capstone
      </p>
      <p className="text-lg" style={{ color: '#475569' }}>
        Shoolini University, Solan, HP
      </p>
    </div>
  );
}
