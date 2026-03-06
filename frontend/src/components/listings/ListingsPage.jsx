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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading…</div>;
  if (error)   return <div style={{ padding: '2rem', textAlign: 'center', color: '#f87171' }}>{error}</div>;

  return (
    <div>
      {user && (
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem', marginTop: 0 }}>
          Welcome back,{' '}
          <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{displayName}</span>
        </p>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
      }}>
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
            whiteSpace: 'nowrap',
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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

function ListingCard({ listing }) {
  const { listingId, address, price, userRating, aiScore } = listing;
  return (
    <Link to={`/listings/${listingId}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: '#1e2535',
          border: '1px solid #374151',
          borderRadius: '14px',
          overflow: 'hidden',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          height: '100%',
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

        <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
          <h2 style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#f3f4f6',
            margin: '0 0 0.4rem 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {address}
          </h2>
          <p style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#818cf8',
            margin: '0 0 1rem 0',
          }}>
            ${price?.toLocaleString()}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <StarDisplay rating={userRating} />
            {aiScore != null ? (
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
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

function StarDisplay({ rating }) {
  if (!rating) return <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>No rating</span>;
  return (
    <span style={{ color: '#facc15', fontSize: '1.1rem', letterSpacing: '2px' }} aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function scoreBadgeStyle(score) {
  if (score >= 70) return { background: 'rgba(6,78,59,0.5)',   color: '#34d399' };
  if (score >= 40) return { background: 'rgba(120,100,0,0.4)', color: '#fbbf24' };
  return               { background: 'rgba(127,29,29,0.5)',  color: '#f87171' };
}