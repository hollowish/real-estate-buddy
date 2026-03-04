// Student B — Form to create a new listing with photo upload via presigned URL

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api.js';

export default function AddListingForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    address: '', price: '', bedrooms: '', bathrooms: '',
    sqft: '', mlsNumber: '', userNotes: '', userRating: 0,
  });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function set(field) {
    return (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the listing — Lambda returns the listing + a presigned S3 PUT URL
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

      const res = await api.post('/api/listings', body);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const { uploadUrl } = await res.json();

      // 2. Upload photo directly to S3 via presigned URL — never touches the server
      if (photo && uploadUrl) {
        const s3Res = await fetch(uploadUrl, {
          method: 'PUT',
          body: photo,
          headers: { 'Content-Type': photo.type },
        });
        if (!s3Res.ok) throw new Error('Photo upload failed. Listing was saved — try editing to add the photo.');
      }

      navigate('/listings');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-500 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">Add Listing</h1>

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

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Photo <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0] || null)}
            className="w-full text-sm text-gray-400
              file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-900
              file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-300
              hover:file:bg-indigo-800"
          />
          <p className="mt-1 text-xs text-gray-500">
            Uploaded directly to S3 via presigned URL — file never passes through the server.
          </p>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-3.5 rounded-lg bg-indigo-600 text-white text-sm font-medium
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving…' : 'Add Listing'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/listings')}
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
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="text-2xl leading-none focus:outline-none"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <span className={star <= display ? 'text-yellow-400' : 'text-gray-600'}>★</span>
        </button>
      ))}
    </div>
  );
}
