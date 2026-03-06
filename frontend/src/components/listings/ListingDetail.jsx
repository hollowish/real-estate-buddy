// Student B — Full listing detail view with photos, notes, and "Get AI Score" button

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../utils/api.js';
import ScoreDisplay from '../ai/ScoreDisplay.jsx';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/api/listings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => setListing(data))
      .catch(() => setError("Listing not found or you don't have access."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/api/listings/${id}`);
      if (!res.ok) throw new Error('Delete failed');
      navigate('/listings');
    } catch {
      setDeleting(false);
      setError('Failed to delete listing. Please try again.');
    }
  }

  if (loading) return <div className="p-8 text-center text-[var(--text-muted)]">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-[var(--error)]">{error}</div>;
  if (!listing) return null;

  const {
    address, price, bedrooms, bathrooms, sqft,
    mlsNumber, userNotes, userRating, photos,
    aiScore, aiAnalysis, createdAt,
  } = listing;

  return (
    <div>

      {/* Back */}
      <Link to="/listings" className="text-sm mb-6 inline-block">
        ← My Listings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">{address}</h1>
          <p className="text-[var(--gold)] font-bold text-2xl mt-1">${price?.toLocaleString()}</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link to={`/listings/${id}/edit`} className="btn-ghost">Edit</Link>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Bedrooms"  value={bedrooms  ?? '—'} />
        <Stat label="Bathrooms" value={bathrooms ?? '—'} />
        <Stat label="Sq Ft"     value={sqft ? sqft.toLocaleString() : '—'} />
      </div>

      {/* MLS */}
      {mlsNumber && (
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          MLS: <span className="font-medium text-white">{mlsNumber}</span>
        </p>
      )}

      {/* User rating */}
      {userRating > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Your Rating</p>
          <span className="text-[var(--gold)] text-xl tracking-wider" aria-label={`${userRating} out of 5 stars`}>
            {'★'.repeat(userRating)}{'☆'.repeat(5 - userRating)}
          </span>
        </div>
      )}

      {/* Notes */}
      {userNotes && (
        <div className="mb-8">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-navy)] rounded-[var(--radius-md)] px-5 py-4">
            {userNotes}
          </p>
        </div>
      )}

      {/* Photos */}
      <div className="mb-8">
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Photos</p>
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((key, i) => (
              <div
                key={i}
                className="h-40 rounded-[var(--radius-md)] bg-[var(--bg-navy)] flex flex-col items-center justify-center text-[var(--text-muted)]"
              >
                <span className="text-3xl mb-2">🖼️</span>
                <span className="text-xs px-2 text-center break-all">{key}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No photos uploaded.</p>
        )}
      </div>

      {/* AI Score */}
      <div className="border-t border-[var(--border)] pt-6">
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">AI Analysis</p>
        <ScoreDisplay
          listingId={id}
          score={aiScore}
          analysis={aiAnalysis}
        />
      </div>

      {/* Metadata */}
      <p className="mt-8 text-xs text-[var(--text-muted)]">
        Added {new Date(createdAt).toLocaleDateString()}
      </p>

    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function Stat({ label, value }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--bg-navy)] px-5 py-4 text-center">
      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
