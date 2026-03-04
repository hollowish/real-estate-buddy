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
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBg(score) {
  if (score >= 70) return 'bg-green-900/30 border-green-700';
  if (score >= 40) return 'bg-yellow-900/30 border-yellow-700';
  return 'bg-red-900/30 border-red-700';
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
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">AI Match Score</div>
              <div className={`text-lg font-semibold ${scoreColor(score)}`}>{scoreLabel(score)}</div>
            </div>
          </div>
          {analysis && <AnalysisPanel analysis={analysis} />}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-3">No AI score yet for this listing.</p>
      )}

      {/* Action button */}
      <button
        onClick={handleScore}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                   hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
