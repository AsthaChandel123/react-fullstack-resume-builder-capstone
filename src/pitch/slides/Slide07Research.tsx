const scoringParams = [
  { param: 'Skills Match', weight: '30%', source: 'NACE Job Outlook 2024' },
  { param: 'Experience Level', weight: '20%', source: 'NACE Internship Survey 2024' },
  { param: 'Education Relevance', weight: '15%', source: 'NACE Job Outlook 2024 (73.4% screen by major)' },
  { param: 'Projects (Quantified)', weight: '10%', source: 'AAC&U / Hart Research 2018' },
  { param: 'Certifications', weight: '5%', source: 'SHRM Credentials 2021' },
  { param: 'Commute Distance', weight: '5%', source: 'Marinescu & Rathelot 2018, AEJ:Macro' },
  { param: 'Extracurricular', weight: '5%', source: 'Roulin & Bangerter 2013, J. Ed. & Work' },
  { param: 'GPA', weight: '3%', source: 'NACE 2024 (38.3% use 3.0 cutoff)' },
  { param: 'Completeness', weight: '2%', source: 'Ladders Eye-Tracking 2018' },
  { param: 'Resume Parseability', weight: 'Hard Gate', source: 'Ladders Eye-Tracking 2018' },
  { param: 'Contradiction Detection', weight: 'Penalty', source: 'Henle, Dineen & Duffy 2019' },
];

const wellbeingParams = [
  { param: 'Commute', weight: '25%', source: 'Clark et al. 2020; Stutzer & Frey 2008' },
  { param: 'Work Hours', weight: '20%', source: 'WHO/ILO Pega et al. 2021' },
  { param: 'Work Mode', weight: '15%', source: 'Bloom et al. 2024, Nature' },
  { param: 'Real Salary (CoL-adjusted)', weight: '15%', source: 'Gallup Wellbeing Index' },
  { param: 'Air Quality (PM2.5)', weight: '10%', source: 'Graff Zivin & Neidell 2012' },
  { param: 'Industry Stability', weight: '5%', source: 'NASSCOM/Aon 2024' },
  { param: 'Heat Stress (WBGT)', weight: '5%', source: 'Nature Climate Change 2022' },
  { param: 'Commute Cost', weight: '5%', source: 'ORF India commute economics' },
];

export function Slide07Research() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-6 md:p-10"
      style={{ backgroundColor: '#ffffff', color: '#182B49' }}
    >
      <h2 className="mb-2 text-4xl font-extrabold md:text-5xl">
        Research-Backed Scoring
      </h2>
      <p className="mb-6 text-lg font-medium" style={{ color: '#475569' }}>
        Every weight traceable to published research. Weights sum to 95% + hard gate + penalty.
      </p>

      <div className="flex w-full max-w-6xl gap-4">
        {/* Candidate Scoring */}
        <div
          className="flex-1 overflow-hidden rounded-2xl"
          style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div
            className="px-4 py-2 text-center text-sm font-bold text-white"
            style={{ backgroundColor: '#182B49' }}
          >
            Candidate Score (9 params + gates)
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th className="px-3 py-1.5 font-bold" style={{ color: '#1e293b' }}>Parameter</th>
                <th className="px-3 py-1.5 font-bold" style={{ color: '#1e293b' }}>Weight</th>
                <th className="px-3 py-1.5 font-bold" style={{ color: '#1e293b' }}>Citation</th>
              </tr>
            </thead>
            <tbody>
              {scoringParams.map((p, i) => (
                <tr
                  key={p.param}
                  style={{
                    backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <td className="px-3 py-1.5 font-semibold" style={{ color: '#1e293b' }}>{p.param}</td>
                  <td
                    className="px-3 py-1.5 font-bold"
                    style={{ color: p.weight.includes('%') ? '#991b1b' : '#182B49' }}
                  >
                    {p.weight}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: '#475569' }}>
                    {p.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Wellbeing Scoring */}
        <div
          className="flex-1 overflow-hidden rounded-2xl"
          style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div
            className="px-4 py-2 text-center text-sm font-bold text-white"
            style={{ backgroundColor: '#166534' }}
          >
            Wellbeing Score (8 params, 35 cities)
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th className="px-3 py-1.5 font-bold" style={{ color: '#1e293b' }}>Parameter</th>
                <th className="px-3 py-1.5 font-bold" style={{ color: '#1e293b' }}>Weight</th>
                <th className="px-3 py-1.5 font-bold" style={{ color: '#1e293b' }}>Citation</th>
              </tr>
            </thead>
            <tbody>
              {wellbeingParams.map((p, i) => (
                <tr
                  key={p.param}
                  style={{
                    backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <td className="px-3 py-1.5 font-semibold" style={{ color: '#1e293b' }}>{p.param}</td>
                  <td className="px-3 py-1.5 font-bold" style={{ color: '#166534' }}>
                    {p.weight}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: '#475569' }}>
                    {p.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
