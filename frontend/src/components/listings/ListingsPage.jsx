// Student B — Shows all listings for the current user as cards
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api.js';
import { useAuth } from '../../auth/AuthContext.jsx';

export default function ListingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const displayName = user?.signInDetails?.loginId || user?.username;

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

  if (loading) return <div className="p-8 text-center text-[var(--text-muted)]">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-[var(--error)]">{error}</div>;

  return (
    <div>
      {user && (
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          Welcome back,{' '}
          <span className="text-white font-medium">{displayName}</span>
        </p>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-white">My Listings</h1>
        <button onClick={() => navigate('/listings/new')} className="btn-primary">
          + Add Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p className="text-lg mb-3">No listings yet.</p>
          <button onClick={() => navigate('/listings/new')} className="btn-secondary btn-sm">
            Add your first listing →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <ListingCard key={listing.listingId} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing }) {
  const { listingId, address, price, userRating, aiScore, photoUrls } = listing;
  const thumb = photoUrls?.[0];
  return (
    <Link to={`/listings/${listingId}`} className="block" style={{ color: 'inherit', textDecoration: 'none' }}>
      <div className="card card-hover card-gold h-full overflow-hidden !p-0">
        {thumb ? (
          <img src={thumb} alt={address} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-[var(--bg-navy)] flex items-center justify-center">
            <span className="text-4xl">🏠</span>
          </div>
        )}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white truncate mb-1">{address}</h3>
          <p className="text-xl font-bold text-[var(--gold)] mb-4">
            ${price?.toLocaleString()}
          </p>
          <div className="flex items-center justify-between">
            <StarDisplay rating={userRating} />
            {aiScore != null ? (
              <span className={`badge ${aiScore >= 70 ? 'badge-success' : aiScore >= 40 ? '' : 'badge-error'}`}>
                AI: {aiScore}
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">Not scored</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StarDisplay({ rating }) {
  if (!rating) return <span className="text-xs text-[var(--text-muted)]">No rating</span>;
  return (
    <span className="text-[var(--gold)] text-lg tracking-wider" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}
