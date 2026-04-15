export function Slide10ThankYou() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 text-center"
      style={{ backgroundColor: '#f8fafc', color: '#182B49' }}
    >
      <img
        src="/assets/images/shoolini-logo.png"
        alt="Shoolini University logo"
        className="mb-8 h-20 w-auto"
        crossOrigin="anonymous"
      />
      <h2 className="mb-6 text-5xl font-extrabold md:text-6xl" style={{ color: '#182B49' }}>
        Thank You
      </h2>
      <p className="mb-2 text-3xl font-bold" style={{ color: '#1e293b' }}>
        Astha Chandel
      </p>
      <p className="text-xl font-medium" style={{ color: '#334155' }}>
        GF202214559
      </p>
      <p className="mt-4 text-lg" style={{ color: '#475569' }}>
        Shoolini University, Solan, Himachal Pradesh
      </p>
      <div
        className="mt-10 rounded-full px-10 py-4 text-2xl font-bold"
        style={{
          backgroundColor: '#182B49',
          color: '#ffffff',
        }}
      >
        Questions?
      </div>
    </div>
  );
}
