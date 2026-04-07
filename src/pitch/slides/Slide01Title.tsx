export function Slide01Title() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-white"
      style={{
        background: 'linear-gradient(135deg, #182B49 0%, #2a4a7a 50%, #e41a1a 100%)',
      }}
    >
      <div className="mb-8 rounded-xl bg-white p-2">
        <img
          src="/assets/images/shoolini-logo.png"
          alt="Shoolini University logo"
          className="h-20 w-auto"
          crossOrigin="anonymous"
        />
      </div>
      <h1 className="mb-6 text-6xl font-extrabold tracking-tight md:text-7xl">
        ResumeAI
      </h1>
      <p className="mb-2 text-2xl font-semibold">Astha Chandel</p>
      <p className="text-xl opacity-90">GF202214559</p>
      <p className="mt-4 text-lg opacity-80">
        BTech CSE Final Semester Capstone
      </p>
      <p className="text-lg opacity-80">Shoolini University, Solan, HP</p>
    </div>
  );
}
