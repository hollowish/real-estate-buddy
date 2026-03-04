import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api.js';

// ─── FIELD ALIASES ───────────────────────────────────────────────────────────
// Maps common MLS CSV column names → our internal field names.
const FIELD_MAP = {
  address:    ['address', 'property address', 'street address', 'location'],
  price:      ['price', 'list price', 'listing price', 'asking price', 'amount'],
  bedrooms:   ['bedrooms', 'beds', 'bed', 'br'],
  bathrooms:  ['bathrooms', 'baths', 'bath', 'ba'],
  sqft:       ['sqft', 'sq ft', 'square feet', 'square footage', 'living area', 'size'],
  mlsNumber:  ['mls number', 'mls #', 'mls#', 'mlsnumber', 'mls', 'listing id', 'listing #'],
  userNotes:  ['notes', 'user notes', 'comments', 'description', 'remarks'],
};

function normalise(header) { return header.toLowerCase().trim(); }

function mapHeaders(headers) {
  const result = {};
  headers.forEach((h, i) => {
    const n = normalise(h);
    for (const [field, aliases] of Object.entries(FIELD_MAP)) {
      if (aliases.includes(n)) { result[field] = i; break; }
    }
  });
  return result;
}

// ─── PARSERS ─────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('File must have a header row and at least one data row.');

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const colMap   = mapHeaders(headers);

  if (colMap.address === undefined) throw new Error('Could not find an "Address" column. Check your CSV headers.');

  return lines.slice(1).map((line, rowIdx) => {
    const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    const get  = (field) => colMap[field] !== undefined ? cols[colMap[field]] : '';
    const num  = (field) => { const v = parseFloat(get(field)); return isNaN(v) ? undefined : v; };

    return {
      _row:       rowIdx + 2,
      address:    get('address'),
      price:      num('price'),
      bedrooms:   num('bedrooms'),
      bathrooms:  num('bathrooms'),
      sqft:       num('sqft'),
      mlsNumber:  get('mlsNumber') || undefined,
      userNotes:  get('userNotes') || undefined,
      userRating: 0,
    };
  }).filter(r => r.address);
}

function parseJSON(text) {
  const data = JSON.parse(text);
  const arr  = Array.isArray(data) ? data : data.listings ?? data.data ?? [];
  if (!arr.length) throw new Error('No listing objects found in JSON file.');
  return arr.map((item, i) => ({
    _row:       i + 1,
    address:    item.address   ?? '',
    price:      item.price     ?? undefined,
    bedrooms:   item.bedrooms  ?? undefined,
    bathrooms:  item.bathrooms ?? undefined,
    sqft:       item.sqft      ?? undefined,
    mlsNumber:  item.mlsNumber ?? item.mls_number ?? undefined,
    userNotes:  item.userNotes ?? item.notes      ?? undefined,
    userRating: 0,
  })).filter(r => r.address);
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AddListingForm() {
  const [tab, setTab] = useState('single'); // 'single' | 'bulk'

  return (
    <div style={S.page}>
      <div style={S.container}>
        <h1 style={S.pageTitle}>Add Listing</h1>

        {/* ── Tabs ── */}
        <div style={S.tabs}>
          <button
            style={S.tab(tab === 'single')}
            onClick={() => setTab('single')}
          >
            Single Listing
          </button>
          <button
            style={S.tab(tab === 'bulk')}
            onClick={() => setTab('bulk')}
          >
            Bulk MLS Import
          </button>
        </div>

        {tab === 'single' ? <SingleForm /> : <BulkImport />}
      </div>
    </div>
  );
}

// ─── SINGLE LISTING FORM ─────────────────────────────────────────────────────
function SingleForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    address: '', price: '', bedrooms: '', bathrooms: '',
    sqft: '', mlsNumber: '', userNotes: '', userRating: 0,
  });
  const [photo, setPhoto]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const body = {
        address:   form.address,
        price:     parseFloat(form.price),
        bedrooms:  form.bedrooms  ? parseInt(form.bedrooms)    : undefined,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : undefined,
        sqft:      form.sqft      ? parseInt(form.sqft)        : undefined,
        mlsNumber: form.mlsNumber || undefined,
        userNotes: form.userNotes || undefined,
        userRating: form.userRating || undefined,
      };
      const res = await api.post('/api/listings', body);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const { uploadUrl } = await res.json();
      if (photo && uploadUrl) {
        const s3 = await fetch(uploadUrl, { method: 'PUT', body: photo, headers: { 'Content-Type': photo.type } });
        if (!s3.ok) throw new Error('Photo upload failed. Listing saved — try editing to add the photo.');
      }
      navigate('/listings');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={S.form}>
      <Field label="Address *">
        <input style={S.input} type="text" required value={form.address} onChange={set('address')} placeholder="123 Main St, Oakland, CA" />
      </Field>

      <Field label="Price (USD) *">
        <input style={S.input} type="number" required min="0" step="1000" value={form.price} onChange={set('price')} placeholder="750000" />
      </Field>

      <div style={S.threeCol}>
        <Field label="Bedrooms">
          <input style={S.input} type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} />
        </Field>
        <Field label="Bathrooms">
          <input style={S.input} type="number" min="0" step="0.5" value={form.bathrooms} onChange={set('bathrooms')} />
        </Field>
        <Field label="Sq Ft">
          <input style={S.input} type="number" min="0" value={form.sqft} onChange={set('sqft')} />
        </Field>
      </div>

      <Field label="MLS Number (optional)">
        <input style={S.input} type="text" value={form.mlsNumber} onChange={set('mlsNumber')} placeholder="ML12345678" />
      </Field>

      <Field label="Notes">
        <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={form.userNotes} onChange={set('userNotes')} />
      </Field>

      <Field label="Your Rating">
        <StarRating value={form.userRating} onChange={(v) => setForm(p => ({ ...p, userRating: v }))} />
      </Field>

      <Field label="Photo (optional)">
        <input
          style={S.input}
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0] || null)}
        />
        <p style={S.hint}>Uploaded directly to S3 — never passes through the server.</p>
      </Field>

      {error && <p style={S.errorText}>{error}</p>}

      <div style={S.actions}>
        <button type="submit" className="btn-primary btn-pill" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add Listing'}
        </button>
        <button type="button" className="btn-ghost btn-pill" onClick={() => navigate('/listings')}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── BULK MLS IMPORT ─────────────────────────────────────────────────────────
function BulkImport() {
  const navigate   = useNavigate();
  const fileRef    = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [parsed,   setParsed]   = useState(null);   // array of listing objects
  const [parseErr, setParseErr] = useState(null);
  const [progress, setProgress] = useState(null);   // { done, total, errors }
  const [done,     setDone]     = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    setParseErr(null); setParsed(null); setProgress(null); setDone(false);

    const ext = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = ext === 'json' ? parseJSON(text) : parseCSV(text);
        if (!rows.length) throw new Error('No valid listings found in the file.');
        setParsed(rows);
      } catch (err) {
        setParseErr(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!parsed?.length) return;
    const total  = parsed.length;
    let done_cnt = 0, errors = 0;
    setProgress({ done: 0, total, errors: 0 });

    for (const listing of parsed) {
      try {
        const { _row, ...body } = listing;
        const res = await api.post('/api/listings', body);
        if (!res.ok) throw new Error();
        done_cnt++;
      } catch {
        errors++;
        done_cnt++;
      }
      setProgress({ done: done_cnt, total, errors });
    }
    setDone(true);
  };

  return (
    <div style={S.form}>

      {/* ── Instructions ── */}
      <div style={S.infoBox}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Accepted formats: CSV or JSON</p>
        <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          CSV must include an <strong>Address</strong> column. Optional columns:{' '}
          <code style={S.code}>Price</code>, <code style={S.code}>Bedrooms</code>,{' '}
          <code style={S.code}>Bathrooms</code>, <code style={S.code}>Sq Ft</code>,{' '}
          <code style={S.code}>MLS Number</code>, <code style={S.code}>Notes</code>.
          Column names are case-insensitive.
        </p>
      </div>

      {/* ── Drop zone ── */}
      {!parsed && !done && (
        <div
          style={S.dropZone(dragging)}
          onClick={() => fileRef.current.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <span style={{ fontSize: '2.5rem' }}>📂</span>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0.5rem 0 0.25rem' }}>
            Drop your MLS file here
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            or click to browse — CSV or JSON
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* ── Parse error ── */}
      {parseErr && (
        <div style={S.errorBox}>
          <strong>Could not parse file:</strong> {parseErr}
          <button style={S.retryBtn} onClick={() => { setParseErr(null); fileRef.current?.click(); }}>
            Try another file
          </button>
        </div>
      )}

      {/* ── Preview table ── */}
      {parsed && !done && (
        <>
          <div style={S.previewHeader}>
            <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
              {parsed.length} listing{parsed.length !== 1 ? 's' : ''} ready to import
            </p>
            <button
              style={{ ...S.retryBtn, color: 'var(--text-muted)', borderColor: 'var(--border)' }}
              onClick={() => { setParsed(null); setProgress(null); }}
            >
              ✕ Clear
            </button>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['#', 'Address', 'Price', 'Bed', 'Bath', 'Sq Ft', 'MLS #'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.map((row) => (
                  <tr key={row._row} style={S.tr}>
                    <td style={S.td}>{row._row}</td>
                    <td style={{ ...S.td, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.address}</td>
                    <td style={S.td}>{row.price ? `$${Number(row.price).toLocaleString()}` : '—'}</td>
                    <td style={S.td}>{row.bedrooms  ?? '—'}</td>
                    <td style={S.td}>{row.bathrooms ?? '—'}</td>
                    <td style={S.td}>{row.sqft ? Number(row.sqft).toLocaleString() : '—'}</td>
                    <td style={S.td}>{row.mlsNumber ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progress bar */}
          {progress && (
            <div style={S.progressWrap}>
              <div style={S.progressBar}>
                <div style={{ ...S.progressFill, width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Importing {progress.done} / {progress.total}
                {progress.errors > 0 && (
                  <span style={{ color: 'var(--error)', marginLeft: '0.5rem' }}>
                    ({progress.errors} failed)
                  </span>
                )}
              </p>
            </div>
          )}

          {!progress && (
            <div style={S.actions}>
              <button className="btn-primary btn-pill" onClick={handleImport}>
                Import {parsed.length} Listing{parsed.length !== 1 ? 's' : ''}
              </button>
              <button className="btn-ghost btn-pill" onClick={() => navigate('/listings')}>
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Done ── */}
      {done && progress && (
        <div style={S.doneBox}>
          <span style={{ fontSize: '2.5rem' }}>✅</span>
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>
            Import complete
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {progress.total - progress.errors} of {progress.total} listings imported successfully.
            {progress.errors > 0 && ` ${progress.errors} failed.`}
          </p>
          <button className="btn-primary btn-pill" onClick={() => navigate('/listings')} style={{ marginTop: '1.25rem' }}>
            View Listings
          </button>
        </div>
      )}

    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.6rem', padding: 0, lineHeight: 1 }}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <span style={{ color: star <= display ? 'var(--gold)' : 'var(--border)' }}>★</span>
        </button>
      ))}
    </div>
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
    maxWidth: 760,
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  pageTitle: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    margin: '0 0 1.5rem',
  },
  tabs: {
    display: 'flex',
    gap: '0.25rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '0.3rem',
    marginBottom: '2rem',
    width: 'fit-content',
  },
  tab: (active) => ({
    padding: '0.5rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    background: active ? 'var(--gold)' : 'transparent',
    color:      active ? '#0a0e1a'     : 'var(--text-secondary)',
  }),
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  input: {
    padding: '0.65rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  threeCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1rem',
  },
  hint: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    margin: '0.25rem 0 0',
  },
  errorText: {
    color: 'var(--error)',
    fontSize: '0.875rem',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '0.5rem',
  },
  // Bulk import
  infoBox: {
    background: 'var(--bg-navy)',
    border: '1px solid var(--border)',
    borderLeft: '4px solid var(--gold)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
  },
  code: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    padding: '0.1em 0.4em',
    fontSize: '0.82em',
    color: 'var(--gold)',
  },
  dropZone: (dragging) => ({
    border: `2px dashed ${dragging ? 'var(--gold)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-lg)',
    background: dragging ? 'rgba(240,180,41,0.05)' : 'var(--bg-secondary)',
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    textAlign: 'center',
  }),
  errorBox: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
    color: 'var(--error)',
    fontSize: '0.875rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  retryBtn: {
    alignSelf: 'flex-start',
    background: 'none',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: 'var(--radius-pill)',
    color: 'var(--error)',
    fontSize: '0.78rem',
    padding: '0.3em 0.9em',
    cursor: 'pointer',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
  },
  th: {
    padding: '0.65rem 0.9rem',
    background: 'var(--bg-navy)',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    textAlign: 'left',
    letterSpacing: '0.04em',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: '0.6rem 0.9rem',
    color: 'var(--text-primary)',
    background: 'var(--bg-secondary)',
    verticalAlign: 'middle',
  },
  progressWrap: {
    display: 'flex',
    flexDirection: 'column',
  },
  progressBar: {
    height: 6,
    background: 'var(--border)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--gold)',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  doneBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 2rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    textAlign: 'center',
  },
};
