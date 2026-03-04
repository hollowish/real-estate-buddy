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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!listing) return null;

  const {
    address, price, bedrooms, bathrooms, sqft,
    mlsNumber, userNotes, userRating, photos,
    aiScore, aiAnalysis, createdAt,
  } = listing;

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">

      {/* Back */}
      <Link to="/listings" className="text-sm text-indigo-400 hover:underline mb-4 inline-block">
        ← My Listings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{address}</h1>
          <p className="text-indigo-400 font-bold text-xl mt-1">${price?.toLocaleString()}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to={`/listings/${id}/edit`}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium
                       hover:bg-gray-700 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm font-medium
                       hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Bedrooms"  value={bedrooms  ?? '—'} />
        <Stat label="Bathrooms" value={bathrooms ?? '—'} />
        <Stat label="Sq Ft"     value={sqft ? sqft.toLocaleString() : '—'} />
      </div>

      {/* MLS */}
      {mlsNumber && (
        <p className="text-sm text-gray-400 mb-4">
          MLS: <span className="font-medium text-gray-200">{mlsNumber}</span>
        </p>
      )}

      {/* User rating */}
      {userRating > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-400 mb-1">Your Rating</p>
          <span className="text-yellow-400 text-xl tracking-tight" aria-label={`${userRating} out of 5 stars`}>
            {'★'.repeat(userRating)}{'☆'.repeat(5 - userRating)}
          </span>
        </div>
      )}

      {/* Notes */}
      {userNotes && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-200 leading-relaxed bg-gray-700 rounded-lg px-4 py-3">
            {userNotes}
          </p>
        </div>
      )}

      {/* Photos */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-400 mb-2">Photos</p>
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((key, i) => (
              <div
                key={i}
                className="h-40 rounded-lg bg-gray-700 flex flex-col items-center justify-center text-gray-500"
              >
                <span className="text-3xl mb-2">🖼️</span>
                <span className="text-xs px-2 text-center break-all">{key}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No photos uploaded.</p>
        )}
      </div>

      {/* AI Score */}
      <div className="border-t border-gray-700 pt-6">
        <p className="text-sm font-medium text-gray-400 mb-1">AI Analysis</p>
        <ScoreDisplay
          listingId={id}
          score={aiScore}
          analysis={aiAnalysis}
        />
      </div>

      {/* Metadata */}
      <p className="mt-8 text-xs text-gray-600">
        Added {new Date(createdAt).toLocaleDateString()}
      </p>

    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-700 px-4 py-3 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-gray-100">{value}</p>
    </div>
  );
}
