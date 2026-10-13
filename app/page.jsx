import Link from 'next/link';
import { EFFECTS, CATEGORIES } from '@/lib/registry';
import EffectLoader from '@/components/EffectLoader';

export default function Home() {
  const groups = Object.keys(CATEGORIES).map((key) => ({
    key,
    label: CATEGORIES[key],
    items: EFFECTS.filter((e) => e.category === key),
  }));

  return (
    <main className="wrap" style={{ paddingTop: 72, paddingBottom: 96 }}>
      <header style={{ maxWidth: 620, marginBottom: 56 }}>
        <h1 style={{ fontSize: 38, fontWeight: 650, letterSpacing: '-0.03em', margin: 0 }}>
          Vault
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--text-2)', marginTop: 14 }}>
          Interactive studies, built from scratch. Each one is a single React component
          with no dependencies beyond React itself — canvas, WebGL or plain DOM — and
          each is written to be lifted straight into a portfolio.
        </p>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-3)', marginTop: 12 }}>
          Every effect pauses when it scrolls out of view and renders a single static
          frame under <code>prefers-reduced-motion</code>.
        </p>
      </header>

      {groups.map((g) => (
        <section key={g.key} style={{ marginBottom: 52 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h2 className="mono" style={{ margin: 0, fontSize: 11 }}>{g.label}</h2>
            <span className="mono">{String(g.items.length).padStart(2, '0')}</span>
          </div>

          <div className="grid">
            {g.items.map((e) => (
              <Link key={e.slug} href={`/vault/${e.slug}`} className="card">
                <div className="card-stage">
                  <EffectLoader slug={e.slug} />
                </div>
                <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--border)' }}>
                  <div className="card-title">{e.title}</div>
                  <p className="card-blurb">{e.blurb}</p>
                  <div className="tags" style={{ marginTop: 10 }}>
                    {e.tags.map((tag) => (
                      <span className="tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <footer className="mono" style={{ paddingTop: 28, borderTop: '1px solid var(--border)' }}>
        MIT — free to copy
      </footer>
    </main>
  );
}
