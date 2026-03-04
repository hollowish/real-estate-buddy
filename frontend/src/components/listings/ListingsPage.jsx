import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api.js';

// ─── TEST / MOCK DATA ─────────────────────────────────────────────────────────
// Remove this array (and the spread below) once the real API is connected.
const MOCK_LISTINGS = [
  {
    listingId:  'mock-001',
    address:    '1847 Telegraph Ave, Oakland, CA 94612',
    price:      875000,
    bedrooms:   3,
    bathrooms:  2,
    sqft:       1450,
    userRating: 4,
    aiScore:    72,
    _isMock:    true,
  },
];

// ─── LISTINGS PAGE ───────────────────────────────────────────────────────────
export default function ListingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    api.get('/api/listings')
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => setListings([...MOCK_LISTINGS, ...(data.listings || [])]))
      .catch(() => setListings(MOCK_LISTINGS))   // show mock even if API is offline
      .finally(() => setLoading(false));
  }, []);

  // Filter client-side when a search query is present
  const visible = searchQuery
    ? listings.filter(l =>
        l.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listings;

  if (loading) return <PageShell><Spinner /></PageShell>;

  return (
    <PageShell>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>My Listings</h1>
          {searchQuery && (
            <p style={S.searchHint}>
              Showing results for <span style={{ color: 'var(--gold)' }}>"{searchQuery}"</span>
              {' '}— {visible.length} found
            </p>
          )}
        </div>
        <button
          className="btn-primary btn-pill"
          style={{ padding: '0.55rem 1.4rem', fontSize: '0.9rem' }}
          onClick={() => navigate('/listings/new')}
        >
          + Add Listing
        </button>
      </div>

      {/* ── Grid or empty state ── */}
      {visible.length === 0 ? (
        <EmptyState searched={!!searchQuery} onAdd={() => navigate('/listings/new')} />
      ) : (
        <div style={S.grid}>
          {visible.map(listing => (
            <ListingCard key={listing.listingId} listing={listing} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ─── LISTING CARD ─────────────────────────────────────────────────────────────
function ListingCard({ listing }) {
  const { listingId, address, price, bedrooms, bathrooms, sqft, userRating, aiScore, _isMock } = listing;

  return (
    <Link to={`/listings/${listingId}`} style={S.card}>
      {/* Photo placeholder */}
      <div style={S.cardPhoto}>
        <span style={{ fontSize: '3rem' }}>🏠</span>
        {_isMock && (
          <span style={S.mockBadge}>Test listing</span>
        )}
      </div>

      <div style={S.cardBody}>
        {/* Address */}
        <p style={S.cardAddress}>{address}</p>

        {/* Price */}
        <p style={S.cardPrice}>
          {price ? `$${price.toLocaleString()}` : 'Price TBD'}
        </p>

        {/* Stats row */}
        <div style={S.cardStats}>
          {bedrooms  != null && <Pill icon="🛏" label={`${bedrooms} bd`} />}
          {bathrooms != null && <Pill icon="🚿" label={`${bathrooms} ba`} />}
          {sqft      != null && <Pill icon="📐" label={`${sqft.toLocaleString()} ft²`} />}
        </div>

        {/* Footer: rating + AI score */}
        <div style={S.cardFooter}>
          <StarDisplay rating={userRating} />
          <AiScoreBadge score={aiScore} />
        </div>
      </div>
    </Link>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
function Pill({ icon, label }) {
  return (
    <span style={S.pill}>
      {icon} {label}
    </span>
  );
}

function StarDisplay({ rating }) {
  if (!rating) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No rating</span>;
  return (
    <span style={{ color: 'var(--gold)', fontSize: '0.95rem', letterSpacing: '1px' }}
          aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function AiScoreBadge({ score }) {
  if (score == null) return <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Not scored</span>;
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--error)';
  return (
    <span style={{ ...S.aiBadge, color, border: `1px solid ${color}`, background: `${color}18` }}>
      AI {score}
    </span>
  );
}

function EmptyState({ searched, onAdd }) {
  return (
    <div style={S.empty}>
      <span style={{ fontSize: '3.5rem' }}>🏘️</span>
      <h3 style={{ color: 'var(--text-primary)', marginTop: '1rem' }}>
        {searched ? 'No listings match your search' : 'No listings yet'}
      </h3>
      {!searched && (
        <>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 320, textAlign: 'center' }}>
            Start tracking properties you're interested in.
          </p>
          <button className="btn-primary btn-pill" onClick={onAdd} style={{ marginTop: '0.5rem' }}>
            Add your first listing
          </button>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
      Loading listings…
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--error)' }}>
      {message}
    </div>
  );
}

function PageShell({ children }) {
  return (
    <main style={S.page}>
      <div style={S.container}>{children}</div>
    </main>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    padding: '2.5rem 0 4rem',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  pageTitle: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  searchHint: {
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    marginTop: '0.35rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: '1.5rem',
  },
  // Card
  card: {
    display: 'block',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    textDecoration: 'none',
    transition: 'transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)',
    cursor: 'pointer',
    // hover handled inline via onMouseEnter/Leave — skipped to keep it simple;
    // CSS class card-hover from index.css handles it via :hover
  },
  cardPhoto: {
    width: '100%',
    height: 180,
    background: 'linear-gradient(135deg, var(--bg-navy), #0d1a35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid var(--border)',
    position: 'relative',
  },
  mockBadge: {
    position: 'absolute',
    top: '0.6rem',
    left: '0.6rem',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    background: 'rgba(240,180,41,0.15)',
    color: 'var(--gold)',
    border: '1px solid rgba(240,180,41,0.3)',
    borderRadius: 'var(--radius-pill)',
    padding: '0.2em 0.65em',
  },
  cardBody: {
    padding: '1.1rem 1.25rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  cardAddress: {
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: '0.95rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0,
    lineHeight: 1.4,
  },
  cardPrice: {
    color: 'var(--gold)',
    fontWeight: 700,
    fontSize: '1.2rem',
    margin: 0,
    lineHeight: 1,
  },
  cardStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginTop: '0.15rem',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border)',
  },
  pill: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    background: 'var(--bg-navy)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-pill)',
    padding: '0.2em 0.65em',
    whiteSpace: 'nowrap',
  },
  aiBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    borderRadius: 'var(--radius-pill)',
    padding: '0.2em 0.7em',
    letterSpacing: '0.03em',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    minHeight: '50vh',
    padding: '3rem 1rem',
  },
};
