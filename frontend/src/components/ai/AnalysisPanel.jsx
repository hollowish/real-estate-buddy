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
          <h4 className="text-sm font-semibold text-green-400 mb-1">Pros</h4>
          <ul className="space-y-1">
            {pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-green-500 mt-0.5">✓</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
      )}

      {cons.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-1">Cons</h4>
          <ul className="space-y-1">
            {cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-red-400 mt-0.5">✗</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary && (
        <div>
          <h4 className="text-sm font-semibold text-gray-300 mb-1">Summary</h4>
          <p className="text-sm text-gray-400 leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}
