import { EFFECTS } from '@/lib/registry';
import { cardVars } from '@/lib/palette';
import EffectLoader from '@/components/EffectLoader';

// Everything lives on this one screen — there is nothing to click through to.
export default function Home() {
  return (
    <main className="shell" style={{ paddingTop: 96, paddingBottom: 96 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <h1 style={{ fontSize: 15, fontWeight: 400, margin: 0, color: 'var(--text)' }}>Vault</h1>
        <span className="mono">{EFFECTS.length}</span>
      </header>

      <div className="feed">
        {EFFECTS.map((e) => {
          const vars = cardVars(e.card.bg, e.card.ink, e.card.ac);
          // Ratios wider than ~2.4:1 collapse on a narrow phone; the
          // stylesheet floors those, flagged here.
          const [w, h] = e.aspect.split('/').map(Number);
          return (
            <section key={e.slug}>
              <div
                className="feed-card"
                data-wide={w / h > 2.4 ? 'true' : undefined}
                style={{
                  ...vars,
                  aspectRatio: e.aspect.replace('/', ' / '),
                  '--card-bg': e.card.bg,
                  '--card-line': vars['--border'],
                }}
              >
                <EffectLoader slug={e.slug} />
              </div>
              <div className="feed-label">
                <span className="feed-name">{e.title}</span>
                <span className="feed-tag">{e.tags[0]}</span>
              </div>
            </section>
          );
        })}
      </div>

      <footer
        className="mono"
        style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--border)' }}
      >
        MIT — free to copy
      </footer>
    </main>
  );
}
