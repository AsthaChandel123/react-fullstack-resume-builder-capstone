export function Slide02Problem() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-8 md:p-16"
      style={{ backgroundColor: '#182B49', color: '#ffffff' }}
    >
      <h2 className="mb-12 text-4xl font-extrabold md:text-5xl">
        The Problem
      </h2>

      <div className="grid max-w-5xl gap-10 md:grid-cols-3">
        <div className="flex flex-col items-center text-center">
          <span
            className="mb-4 text-7xl font-black"
            style={{ color: '#e41a1a' }}
          >
            0.4%
          </span>
          <p className="text-xl font-semibold leading-relaxed">
            callback rate per application. 242 applicants compete for every opening.
          </p>
          <cite className="mt-3 block text-sm not-italic opacity-60">
            Huntr Job Search Statistics 2026; Greenhouse 2025
          </cite>
        </div>

        <div className="flex flex-col items-center text-center">
          <span
            className="mb-4 text-7xl font-black"
            style={{ color: '#ffdc00' }}
          >
            62%
          </span>
          <p className="text-xl font-semibold leading-relaxed">
            of hiring managers reject AI-generated resumes that lack personalization
          </p>
          <cite className="mt-3 block text-sm not-italic opacity-60">
            Resume Now Hiring Manager Survey 2024
          </cite>
        </div>

        <div className="flex flex-col items-center text-center">
          <span
            className="mb-4 text-7xl font-black"
            style={{ color: '#e41a1a' }}
          >
            23h
          </span>
          <p className="text-xl font-semibold leading-relaxed">
            spent screening resumes per single hire. 6-8 seconds per resume.
          </p>
          <cite className="mt-3 block text-sm not-italic opacity-60">
            Testlify Resume Screening Guide 2025
          </cite>
        </div>
      </div>
    </div>
  );
}
