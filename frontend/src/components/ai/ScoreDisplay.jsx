// Student C — AI score display: color-coded score + "Get AI Score" button
// Props:
//   listingId  {string}   — passed to the API call
//   score      {number|null}  — pre-existing score (null if never scored)
//   analysis   {object|null}  — pre-existing analysis { pros, cons, summary }

import { useState } from 'react';
import { api } from '../../utils/api.js';
import AnalysisPanel from './AnalysisPanel.jsx';

// ─── Score color helper ───────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 70) return 'text-[var(--success)]';
  if (score >= 40) return 'text-[var(--gold)]';
  return 'text-[var(--error)]';
}

function scoreBg(score) {
  if (score >= 70) return 'bg-[var(--success-muted)] border-[var(--success)]';
  if (score >= 40) return 'bg-[var(--gold-muted)] border-[var(--gold)]';
  return 'bg-[var(--error-muted)] border-[var(--error)]';
}

function scoreLabel(score) {
  if (score >= 70) return 'Great match';
  if (score >= 40) return 'Moderate match';
  return 'Poor match';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScoreDisplay({ listingId, score: initialScore, analysis: initialAnalysis }) {
  const [score, setScore] = useState(initialScore ?? null);
  const [analysis, setAnalysis] = useState(initialAnalysis ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleScore() {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/api/ai/score', { listingId });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setScore(data.score);
      setAnalysis({ pros: data.pros, cons: data.cons, summary: data.summary });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {/* Score display */}
      {score !== null ? (
        <div className={`rounded-xl border p-5 mb-4 ${scoreBg(score)}`}>
          <div className="flex items-center gap-4">
            <span className={`text-5xl font-bold ${scoreColor(score)}`}>{score}</span>
            <div>
              <div className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide">AI Match Score</div>
              <div className={`text-lg font-semibold ${scoreColor(score)}`}>{scoreLabel(score)}</div>
            </div>
          </div>
          {analysis && <AnalysisPanel analysis={analysis} />}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)] mb-3">No AI score yet for this listing.</p>
      )}

      {/* Action button */}
      <button
        onClick={handleScore}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? (
          <>
            <Spinner />
            Analyzing…
          </>
        ) : (
          score !== null ? 'Re-score with AI' : 'Get AI Score'
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline mr-2" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
