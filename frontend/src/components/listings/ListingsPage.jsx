// Student B — Shows all listings for the current user as cards

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api.js';

export default function ListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/listings')
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => setListings(data.listings || []))
      .catch(() => setError('Failed to load listings. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <button
          onClick={() => navigate('/listings/new')}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                     hover:bg-indigo-700 transition-colors"
        >
          + Add Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-3">No listings yet.</p>
          <button
            onClick={() => navigate('/listings/new')}
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            Add your first listing →
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map(listing => (
            <ListingCard key={listing.listingId} listing={listing} />
          ))}
        </div>
      )}

    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing }) {
  const { listingId, address, price, userRating, aiScore } = listing;

  return (
    <Link
      to={`/listings/${listingId}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
    >
      {/* Photo placeholder — actual photos need CloudFront (Student D) */}
      <div className="w-full h-36 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
        <span className="text-5xl">🏠</span>
      </div>

      <h2 className="font-semibold text-gray-800 text-sm leading-snug mb-1 truncate">{address}</h2>
      <p className="text-indigo-600 font-bold text-lg mb-3">${price?.toLocaleString()}</p>

      <div className="flex items-center justify-between">
        <StarDisplay rating={userRating} />
        {aiScore != null ? (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadgeClass(aiScore)}`}>
            AI: {aiScore}
          </span>
        ) : (
          <span className="text-xs text-gray-300">Not scored</span>
        )}
      </div>
    </Link>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarDisplay({ rating }) {
  if (!rating) return <span className="text-xs text-gray-300">No rating</span>;
  return (
    <span className="text-yellow-400 text-sm tracking-tight" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function scoreBadgeClass(score) {
  if (score >= 70) return 'bg-green-100 text-green-700';
  if (score >= 40) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}
