// Edit an existing listing — fetches current data, pre-populates form, PUTs changes

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api.js';

export default function EditListingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    address: '', price: '', bedrooms: '', bathrooms: '',
    sqft: '', mlsNumber: '', userNotes: '', userRating: 0,
  });
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/api/listings/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => {
        setForm({
          address:    data.address || '',
          price:      data.price ?? '',
          bedrooms:   data.bedrooms ?? '',
          bathrooms:  data.bathrooms ?? '',
          sqft:       data.sqft ?? '',
          mlsNumber:  data.mlsNumber || '',
          userNotes:  data.userNotes || '',
          userRating: data.userRating || 0,
        });
        setExistingPhotos(data.photoUrls || []);
      })
      .catch(() => setError("Listing not found or you don't have access."))
      .finally(() => setLoading(false));
  }, [id]);

  function set(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body = {
        address:    form.address,
        price:      parseFloat(form.price),
        bedrooms:   form.bedrooms   ? parseInt(form.bedrooms)    : undefined,
        bathrooms:  form.bathrooms  ? parseFloat(form.bathrooms) : undefined,
        sqft:       form.sqft       ? parseInt(form.sqft)        : undefined,
        mlsNumber:  form.mlsNumber  || undefined,
        userNotes:  form.userNotes  || undefined,
        userRating: form.userRating || undefined,
      };

      if (photo) body.addPhoto = true;

      const res = await api.put(`/api/listings/${id}`, body);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const { uploadUrl } = await res.json();
      if (photo && uploadUrl) {
        const s3Res = await fetch(uploadUrl, {
          method: 'PUT',
          body: photo,
          headers: { 'Content-Type': photo.type },
        });
        if (!s3Res.ok) throw new Error('Photo upload failed. Changes were saved — try again to add the photo.');
      }

      navigate(`/listings/${id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-[var(--text-muted)]">Loading...</div>;
  if (error && !form.address) return <div className="p-8 text-center text-[var(--error)]">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white mb-8">Edit Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Address */}
        <div>
          <label className="text-sm font-medium mb-1.5">Address *</label>
          <input type="text" required value={form.address} onChange={set('address')} />
        </div>

        {/* Price */}
        <div>
          <label className="text-sm font-medium mb-1.5">Price (USD) *</label>
          <input type="number" required min="0" step="1000" value={form.price} onChange={set('price')} />
        </div>

        {/* Bedrooms / Bathrooms / Sq Ft */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5">Bedrooms</label>
            <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5">Bathrooms</label>
            <input type="number" min="0" step="0.5" value={form.bathrooms} onChange={set('bathrooms')} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5">Sq Ft</label>
            <input type="number" min="0" value={form.sqft} onChange={set('sqft')} />
          </div>
        </div>

        {/* MLS Number */}
        <div>
          <label className="text-sm font-medium mb-1.5">
            MLS Number <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>
          <input type="text" value={form.mlsNumber} onChange={set('mlsNumber')} />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-1.5">Notes</label>
          <textarea rows={3} value={form.userNotes} onChange={set('userNotes')} className="resize-none" />
        </div>

        {/* Star Rating */}
        <div>
          <label className="text-sm font-medium mb-2">Your Rating</label>
          <StarRating
            value={form.userRating}
            onChange={(v) => setForm(prev => ({ ...prev, userRating: v }))}
          />
        </div>

        {/* Existing Photos */}
        {existingPhotos.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-1.5">Current Photos</label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {existingPhotos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="h-28 w-full object-cover rounded-[var(--radius-md)]"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add Photo */}
        <div>
          <label className="text-sm font-medium mb-1.5">
            Add Photo <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0] || null)}
            className="w-full text-sm text-[var(--text-secondary)]
              file:mr-3 file:rounded-[var(--radius-md)] file:border-0
              file:bg-[var(--gold-muted)] file:px-3 file:py-1.5
              file:text-sm file:font-medium file:text-[var(--gold)]
              hover:file:bg-[var(--gold-muted)]"
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-4">
          <button type="submit" disabled={submitting} className="btn-primary btn-lg">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(`/listings/${id}`)} className="btn-ghost btn-lg">
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;

  return (
    <div className="flex gap-3 py-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="!p-0 !bg-transparent !border-0 text-4xl leading-none"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <span className={star <= display ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'}>★</span>
        </button>
      ))}
    </div>
  );
}
