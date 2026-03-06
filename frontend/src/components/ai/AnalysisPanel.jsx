// Student C — Pros, cons, and summary panel rendered inside ScoreDisplay
// Props:
//   analysis { pros: string[], cons: string[], summary: string }

export default function AnalysisPanel({ analysis }) {
  if (!analysis) return null;
  const { pros = [], cons = [], summary = '' } = analysis;

  return (
    <div className="mt-4 space-y-3">
      {pros.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--success)] mb-1">Pros</h4>
          <ul className="space-y-1">
            {pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--success)] mt-0.5">&#10003;</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cons.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--error)] mb-1">Cons</h4>
          <ul className="space-y-1">
            {cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--error)] mt-0.5">&#10007;</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">Summary</h4>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}
