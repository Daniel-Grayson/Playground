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
        // Cards wider than the 3/2 the phone floors them to get marked, so
        // globals.css can apply that floor. The rule has always been there;
        // nothing set the attribute, so on a 390px screen the widest cards
        // came out 358x165 instead of the ~239px tall the rule intends.
        const [aw, ah] = e.aspect.split('/').map(Number);
        return (
          <section key={e.slug}>
            <div
              className="feed-card"
              data-wide={aw / ah > 1.6 ? 'true' : undefined}
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
