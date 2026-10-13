import { EFFECTS } from '@/lib/registry';
import Feed from '@/components/Feed';

// Everything is on this one screen. Opening an effect is an overlay, not a
// route — there is no second page to navigate to.
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

      <Feed effects={EFFECTS} />

      <footer
        className="mono"
        style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--border)' }}
      >
        MIT — free to copy
      </footer>
    </main>
  );
}
