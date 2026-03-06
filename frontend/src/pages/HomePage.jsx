import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const HERO_IMG_KEY = 'reb_hero_image';

export default function HomePage() {
  const [heroImage, setHeroImage] = useState(() => localStorage.getItem(HERO_IMG_KEY) || null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setHeroImage(dataUrl);
      localStorage.setItem(HERO_IMG_KEY, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleImageUpload(e.dataTransfer.files[0]);
  };

  const handleRemoveImage = () => {
    setHeroImage(null);
    localStorage.removeItem(HERO_IMG_KEY);
  };

  return (
    <main style={S.page}>

      {/* HERO */}
      <section style={{
        ...S.hero,
        backgroundImage: heroImage
          ? `linear-gradient(rgba(10,14,26,0.72), rgba(10,14,26,0.88)), url(${heroImage})`
          : 'linear-gradient(135deg, #0a0e1a 0%, #1a2744 50%, #0d1a35 100%)',
      }}>

        {/* Image upload zone */}
        <div style={S.uploadZoneWrap}>
          <div
            style={S.uploadZone}
            onClick={() => fileInputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            title="Upload a hero background image"
          >
            <span style={{ fontSize: '1.4rem' }}>📸</span>
            <span style={S.uploadLabel}>
              {heroImage ? 'Change photo' : 'Upload hero photo'}
            </span>
            <span style={S.uploadHint}>Click or drag & drop</span>
          </div>
          {heroImage && (
            <button style={S.removeBtn} onClick={handleRemoveImage}>✕ Remove</button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleImageUpload(e.target.files[0])}
          />
        </div>

        {/* Hero content */}
        <div style={S.heroContent}>
          <div style={S.taglinePill}>AI-Powered Home Analysis</div>

          <h1 style={S.heroTitle}>
            HomeScore
          </h1>

          <h1 style={S.heroTitle}>
            Rate it.{' '}
            <span style={{ color: 'var(--gold)' }}>Compare it.</span>
            {' '}Own it.
          </h1>

          <p style={S.heroSubtitle}>
            Finding your perfect home is one of the biggest decisions of your life –
            and it shouldn't feel overwhelming. HomeScore takes the guesswork
            out of home buying with AI-powered analysis that rates every property
            on a clear 1–10 scale.
          </p>

          <div style={S.heroCtas}>
            <Link to="/listings" className="btn-primary btn-pill btn-lg" style={S.ctaLink}>
              View Listings
            </Link>
            <Link to="/signup" className="btn-secondary btn-pill btn-lg" style={S.ctaLink}>
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Stat strip */}
        <div style={S.statStrip}>
          {[
            { value: '10×', label: 'Faster decisions' },
            { value: '1–10', label: 'AI score per listing' },
            { value: '100%', label: 'Data-driven' },
          ].map(({ value, label }) => (
            <div key={label} style={S.stat}>
              <span style={S.statValue}>{value}</span>
              <span style={S.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={S.section}>
        <div style={S.container}>
          <h2 style={S.sectionTitle}>How It Works</h2>
          <p style={S.sectionSub}>Three steps to your perfect home.</p>

          <div style={S.featureGrid}>
            {[
              { icon: '🏠', title: 'Add Properties', body: "Input any property listings you're considering – address, price, bedrooms, and more." },
              { icon: '🤔', title: 'AI Analysis', body: 'Our engine scores each listing 1–10 across location, price, size, and overall value.' },
              { icon: '📊', title: 'Compare Side-by-Side', body: 'See every property ranked clearly so the best choice jumps out immediately.' },
              { icon: '✅', title: 'Make Your Move', body: 'Walk into every negotiation with data-backed confidence behind you.' },
            ].map(({ icon, title, body }) => (
              <div key={title} style={S.featureCard}>
                <span style={S.featureIcon}>{icon}</span>
                <h3 style={S.featureTitle}>{title}</h3>
                <p style={S.featureBody}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={S.aboutSection} id="about">
        <div style={{ ...S.container, maxWidth: 760 }}>

          <div style={S.goldDivider} />
          <p style={S.aboutEyebrow}>About HomeScore</p>

          <h2 style={S.aboutTitle}>
            We built the tool we wished existed.
          </h2>

          <div style={S.aboutBody}>
            <p>
              Finding your perfect home is one of the biggest decisions of your life –
              and it shouldn't feel overwhelming.
            </p>
            <p>
              HomeScore takes the guesswork out of home buying. Simply input
              multiple property listings and let our AI-powered engine analyze each
              one across key factors like location, price, size, and value. Every
              listing gets rated on a scale of 1 to 10, giving you a clear,
              side-by-side comparison so you can make the most informed decision possible.
            </p>
            <p>
              Whether you're a first-time buyer or an experienced investor,
              HomeScore gives you the clarity and confidence to choose the
              home that's right for you.
            </p>
          </div>

          <div style={S.taglineBlock}>
            <span style={S.taglineBig}>"Rate it. Compare it. Own it."</span>
          </div>

          <div style={S.aboutCta}>
            <Link to="/listings" className="btn-primary btn-pill">
              Start Comparing Listings
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}

const S = {
  page: {
    background: 'var(--bg-primary)',
    minHeight: '100vh',
  },

  hero: {
    position: 'relative',
    minHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '6rem 2rem 3rem',
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: 720,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
    zIndex: 1,
  },
  taglinePill: {
    display: 'inline-block',
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    background: 'rgba(240,180,41,0.12)',
    border: '1px solid rgba(240,180,41,0.3)',
    borderRadius: 'var(--radius-pill)',
    padding: '0.35em 1.1em',
  },
  heroTitle: {
    fontSize: 'clamp(2.2rem, 6vw, 4rem)',
    fontWeight: 900,
    color: 'var(--text-primary)',
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    margin: 0,
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.15rem)',
    color: 'var(--text-secondary)',
    lineHeight: 1.75,
    maxWidth: 580,
    margin: 0,
  },
  heroCtas: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '0.5rem',
  },
  ctaLink: {
    fontSize: '1rem',
    padding: '0.75rem 2rem',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },

  statStrip: {
    display: 'flex',
    gap: '3rem',
    marginTop: '4rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    zIndex: 1,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  statValue: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--gold)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },

  uploadZoneWrap: {
    position: 'absolute',
    top: '1.25rem',
    right: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.4rem',
    zIndex: 10,
  },
  uploadZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
    padding: '0.65rem 1rem',
    background: 'rgba(10,14,26,0.7)',
    border: '1px dashed rgba(240,180,41,0.4)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    backdropFilter: 'blur(6px)',
    transition: 'border-color 0.2s, background 0.2s',
    minWidth: 140,
  },
  uploadLabel: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--gold)',
  },
  uploadHint: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
  },
  removeBtn: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--error)',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-pill)',
    padding: '0.25em 0.8em',
    cursor: 'pointer',
  },

  section: {
    padding: '5rem 2rem',
    background: 'var(--bg-secondary)',
  },
  container: {
    maxWidth: 896,
    margin: '0 auto',
    width: '100%',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  sectionSub: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    marginBottom: '3rem',
    fontSize: '1rem',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    background: 'var(--bg-navy)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.75rem',
  },
  featureIcon: {
    fontSize: '2rem',
    lineHeight: 1,
  },
  featureTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  featureBody: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.65,
    margin: 0,
  },

  aboutSection: {
    padding: '5rem 2rem 6rem',
    background: 'var(--bg-primary)',
    textAlign: 'center',
  },
  goldDivider: {
    width: 56,
    height: 3,
    background: 'var(--gold)',
    borderRadius: 2,
    margin: '0 auto 1.5rem',
  },
  aboutEyebrow: {
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    margin: '0 0 0.75rem',
  },
  aboutTitle: {
    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '2rem',
    letterSpacing: '-0.02em',
  },
  aboutBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
    textAlign: 'left',
  },
  taglineBlock: {
    margin: '3rem 0 2rem',
    padding: '1.75rem 2rem',
    background: 'var(--bg-navy)',
    border: '1px solid rgba(240,180,41,0.25)',
    borderLeft: '4px solid var(--gold)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
  },
  taglineBig: {
    fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
    fontWeight: 800,
    color: 'var(--gold)',
    fontStyle: 'italic',
    letterSpacing: '-0.01em',
  },
  aboutCta: {
    display: 'flex',
    justifyContent: 'center',
  },
};
