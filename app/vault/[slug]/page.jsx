import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BY_SLUG, EFFECTS, CATEGORIES } from '@/lib/registry';
import EffectStudio from '@/components/EffectStudio';

export function generateStaticParams() {
  return EFFECTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const effect = BY_SLUG[slug];
  if (!effect) return {};
  return { title: effect.title, description: effect.blurb };
}

export default async function EffectPage({ params }) {
  const { slug } = await params;
  const effect = BY_SLUG[slug];
  if (!effect) notFound();

  const index = EFFECTS.findIndex((e) => e.slug === slug);
  const next = EFFECTS[(index + 1) % EFFECTS.length];

  return (
    <main className="wrap" style={{ paddingTop: 36, paddingBottom: 96 }}>
      <nav style={{ marginBottom: 28 }}>
        <Link href="/" className="mono" style={{ textDecoration: 'none' }}>
          ← Vault
        </Link>
      </nav>

      <header style={{ maxWidth: 660, marginBottom: 24 }}>
        <div className="mono" style={{ marginBottom: 10 }}>{CATEGORIES[effect.category]}</div>
        <h1 style={{ fontSize: 32, fontWeight: 650, letterSpacing: '-0.03em', margin: 0 }}>
          {effect.title}
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--text-2)', marginTop: 12 }}>
          {effect.blurb}
        </p>
      </header>

      <EffectStudio slug={effect.slug} />

      <section style={{ maxWidth: 660, marginTop: 40 }}>
        <h2 className="mono" style={{ marginBottom: 10 }}>How it works</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)', margin: 0 }}>
          {effect.mechanism}
        </p>
        <div className="tags" style={{ marginTop: 18 }}>
          {effect.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
        </div>
      </section>

      <nav
        style={{
          marginTop: 56,
          paddingTop: 24,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <span className="mono">Next</span>
        <Link href={`/vault/${next.slug}`} style={{ textDecoration: 'none', fontWeight: 560 }}>
          {next.title} →
        </Link>
      </nav>
    </main>
  );
}
