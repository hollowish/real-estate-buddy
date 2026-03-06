// Profile & preferences page — display name + AI scoring preferences
import { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

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

  if (loading) return <div className="p-8 text-center text-[var(--text-muted)]">Loading…</div>;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-white mb-3">My Profile</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Set your home-buying preferences so the AI can score listings for you personally.
      </p>

      <form onSubmit={handleSave} className="space-y-5">

        <div>
          <label className="text-sm font-medium mb-1.5">Display Name</label>
          <input type="text" value={form.displayName} onChange={set('displayName')}
            placeholder="Your name" />
        </div>

        <hr />
        <p className="text-xs font-semibold text-[var(--gold)] uppercase tracking-wide">
          AI Scoring Preferences
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5">Min Bedrooms</label>
            <input type="number" min="0" value={form.minBedrooms} onChange={set('minBedrooms')}
              placeholder="e.g. 3" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5">Max Price (USD)</label>
            <input type="number" min="0" step="10000" value={form.maxPrice}
              onChange={set('maxPrice')} placeholder="e.g. 800000" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5">
            Must-Haves{' '}
            <span className="text-[var(--text-muted)] font-normal">(comma-separated)</span>
          </label>
          <input type="text" value={form.mustHave} onChange={set('mustHave')}
            placeholder="e.g. garage, backyard, good schools" />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5">
            Deal-Breakers{' '}
            <span className="text-[var(--text-muted)] font-normal">(comma-separated)</span>
          </label>
          <input type="text" value={form.dealBreakers} onChange={set('dealBreakers')}
            placeholder="e.g. flood zone, HOA over $500, busy street" />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5">Commute Address</label>
          <input type="text" value={form.commuteAddress} onChange={set('commuteAddress')}
            placeholder="e.g. 123 Work St, San Francisco, CA" />
        </div>

        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        {saved && <p className="text-sm text-[var(--success)]">Preferences saved!</p>}

        <div className="pt-4">
          <button type="submit" disabled={saving} className="btn-primary btn-lg">
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>

      </form>
    </div>
  );
}
