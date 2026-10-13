import Link from 'next/link';
import { EFFECTS, CATEGORIES } from '@/lib/registry';
import EffectLoader from '@/components/EffectLoader';

export default function Home() {
  return (
    <main className="wrap" style={{ paddingTop: 64, paddingBottom: 120 }}>
      <header
        style={{
          maxWidth: 1040,
          margin: '0 auto 56px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
          Vault
        </h1>
        <span className="mono">{EFFECTS.length} studies</span>
      </header>

      <div className="feed">
        {EFFECTS.map((e, i) => (
          <Link key={e.slug} href={`/vault/${e.slug}`} className="feed-item">
            <div className="feed-stage">
              <EffectLoader slug={e.slug} />
            </div>
            <div className="feed-caption">
              <div>
                <div className="feed-title">{e.title}</div>
                <p className="feed-blurb">{e.blurb}</p>
              </div>
              <span className="feed-index">
                {String(i + 1).padStart(2, '0')} · {CATEGORIES[e.category]}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <footer
        className="mono"
        style={{
          maxWidth: 1040,
          margin: '96px auto 0',
          paddingTop: 28,
          borderTop: '1px solid var(--border)',
        }}
      >
        MIT — free to copy
      </footer>
    </main>
  );
}
