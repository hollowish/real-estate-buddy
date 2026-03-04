// Profile & preferences page — display name + AI scoring preferences
import { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

const inputClass = 'w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-500 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function ProfilePage() {
  const [form, setForm] = useState({
    displayName: '',
    minBedrooms: '',
    maxPrice: '',
    mustHave: '',
    dealBreakers: '',
    commuteAddress: '',
  });
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/auth/profile')
      .then(res => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setProfileExists(true);
        const p = data.preferences || {};
        setForm({
          displayName:    data.displayName || '',
          minBedrooms:    p.minBedrooms    != null ? String(p.minBedrooms) : '',
          maxPrice:       p.maxPrice       != null ? String(p.maxPrice)    : '',
          mustHave:       (p.mustHave      || []).join(', '),
          dealBreakers:   (p.dealBreakers  || []).join(', '),
          commuteAddress: p.commuteAddress || '',
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const splitTags = (str) =>
    str.split(',').map(s => s.trim()).filter(Boolean);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      displayName: form.displayName,
      preferences: {
        minBedrooms:    form.minBedrooms    ? parseInt(form.minBedrooms)  : undefined,
        maxPrice:       form.maxPrice       ? parseFloat(form.maxPrice)   : undefined,
        mustHave:       splitTags(form.mustHave),
        dealBreakers:   splitTags(form.dealBreakers),
        commuteAddress: form.commuteAddress || undefined,
      },
    };

    try {
      const method = profileExists ? api.put : api.post;
      const res = await method('/api/auth/profile', payload);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setProfileExists(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">My Profile</h1>
      <p className="text-sm text-gray-400 mb-6">
        Set your home-buying preferences so the AI can score listings for you personally.
      </p>

      <form onSubmit={handleSave} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
          <input type="text" value={form.displayName} onChange={set('displayName')}
            placeholder="Your name" className={inputClass} />
        </div>

        <hr className="border-gray-700" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          AI Scoring Preferences
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Min Bedrooms</label>
            <input type="number" min="0" value={form.minBedrooms} onChange={set('minBedrooms')}
              placeholder="e.g. 3" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Max Price (USD)</label>
            <input type="number" min="0" step="10000" value={form.maxPrice}
              onChange={set('maxPrice')} placeholder="e.g. 800000" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Must-Haves{' '}
            <span className="text-gray-500 font-normal">(comma-separated)</span>
          </label>
          <input type="text" value={form.mustHave} onChange={set('mustHave')}
            placeholder="e.g. garage, backyard, good schools"
            className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Deal-Breakers{' '}
            <span className="text-gray-500 font-normal">(comma-separated)</span>
          </label>
          <input type="text" value={form.dealBreakers} onChange={set('dealBreakers')}
            placeholder="e.g. flood zone, HOA over $500, busy street"
            className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Commute Address</label>
          <input type="text" value={form.commuteAddress} onChange={set('commuteAddress')}
            placeholder="e.g. 123 Work St, San Francisco, CA"
            className={inputClass} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-green-400">Preferences saved!</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-3.5 rounded-lg bg-indigo-600 text-white text-sm font-medium
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>

      </form>
    </div>
  );
}
