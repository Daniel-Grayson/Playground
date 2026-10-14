'use client';

import EffectLoader from './EffectLoader';
import { cardVars } from '@/lib/palette';

/**
 * The whole site: a column of cards, each playing by itself. Nothing is
 * clickable — there is no detail view and nothing to navigate to.
 */
export default function Feed({ effects }) {
  return (
    <div className="feed">
      {effects.map((e) => {
        const vars = cardVars(e.card.bg, e.card.ink, e.card.ac);
        return (
          <section key={e.slug}>
            <div
              className="feed-card"
              style={{
                ...vars,
                aspectRatio: e.aspect.replace('/', ' / '),
                '--card-bg': e.card.bg,
              }}
            >
              <EffectLoader slug={e.slug} />
            </div>
            <div className="feed-label">
              <span className="feed-name">{e.title}</span>
            </div>
          </section>
        );
      })}
    </div>
  );
}
