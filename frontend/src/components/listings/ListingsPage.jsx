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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (error)   return <div className="p-8 text-center text-red-400">{error}</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 2rem' }}>

      {user && (
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
          Welcome back,{' '}
          <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{displayName}</span>
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f9fafb', margin: 0 }}>
          My Listings
        </h1>
        <button
          onClick={() => navigate('/listings/new')}
          style={{
            padding: '0.65rem 1.5rem',
            borderRadius: '8px',
            background: '#4f46e5',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#4338ca'}
          onMouseOut={e => e.currentTarget.style.background = '#4f46e5'}
        >
          + Add Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6b7280' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>No listings yet.</p>
          <button
            onClick={() => navigate('/listings/new')}
            style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Add your first listing →
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
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
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        background: '#1e2535',
        border: '1px solid #374151',
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = '#6366f1';
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.15)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = '#374151';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Photo / placeholder */}
        <div style={{
          width: '100%',
          height: '160px',
          background: '#263045',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '3.5rem' }}>🏠</span>
        </div>

        {/* Card body — address, price, footer */}
        <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#f3f4f6',
            marginBottom: '0.4rem',
            marginTop: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {address}
          </h2>

          <p style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#818cf8',
            marginTop: 0,
            marginBottom: '1rem',
          }}>
            ${price?.toLocaleString()}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <StarDisplay rating={userRating} />
            {aiScore != null ? (
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '999px',
                ...scoreBadgeStyle(aiScore),
              }}>
                AI: {aiScore}
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>Not scored</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarDisplay({ rating }) {
  if (!rating) return <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>No rating</span>;
  return (
    <span style={{ color: '#facc15', fontSize: '1.1rem', letterSpacing: '2px' }} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function scoreBadgeStyle(score) {
  if (score >= 70) return { background: 'rgba(6,78,59,0.5)',  color: '#34d399' };
  if (score >= 40) return { background: 'rgba(78,63,6,0.5)',  color: '#fbbf24' };
  return               { background: 'rgba(127,29,29,0.5)', color: '#f87171' };
}