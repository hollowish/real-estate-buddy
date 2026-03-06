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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch existing listing on mount
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

      const res = await api.put(`/api/listings/${id}`, body);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      navigate(`/listings/${id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-500 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (error && !form.address) return <div className="p-8 text-center text-red-400">{error}</div>;

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Edit Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Address *</label>
          <input type="text" required value={form.address} onChange={set('address')} className={inputClass} />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Price (USD) *</label>
          <input type="number" required min="0" step="1000" value={form.price} onChange={set('price')} className={inputClass} />
        </div>

        {/* Bedrooms / Bathrooms / Sq Ft */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Bedrooms</label>
            <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Bathrooms</label>
            <input type="number" min="0" step="0.5" value={form.bathrooms} onChange={set('bathrooms')} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sq Ft</label>
            <input type="number" min="0" value={form.sqft} onChange={set('sqft')} className={inputClass} />
          </div>
        </div>

        {/* MLS Number */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            MLS Number <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input type="text" value={form.mlsNumber} onChange={set('mlsNumber')} className={inputClass} />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
          <textarea rows={3} value={form.userNotes} onChange={set('userNotes')}
            className={`${inputClass} resize-none`} />
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Your Rating</label>
          <StarRating
            value={form.userRating}
            onChange={(v) => setForm(prev => ({ ...prev, userRating: v }))}
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-3.5 rounded-lg bg-indigo-600 text-white text-sm font-medium
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/listings/${id}`)}
            className="px-5 py-3.5 rounded-lg border border-gray-600 text-gray-300 text-sm font-medium
                       hover:bg-gray-700 transition-colors"
          >
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
          className="text-4xl leading-none focus:outline-none"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <span className={star <= display ? 'text-yellow-400' : 'text-gray-600'}>★</span>
        </button>
      ))}
    </div>
  );
}
