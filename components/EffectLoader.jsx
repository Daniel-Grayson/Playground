'use client';

import dynamic from 'next/dynamic';

// None of these server-render: they open a canvas context and measure layout.
// next/dynamic needs an inline object literal, hence the repetition.
function Placeholder() {
  return <div style={{ width: '100%', height: '100%' }} />;
}

const MAP = {
  'plate-develop': dynamic(() => import('./effects/PlateDevelop'), { ssr: false, loading: Placeholder }),
  'relief-contour': dynamic(() => import('./effects/ReliefContour'), { ssr: false, loading: Placeholder }),
  'loom-damask': dynamic(() => import('./effects/LoomDamask'), { ssr: false, loading: Placeholder }),
  'tumble-blocks': dynamic(() => import('./effects/TumbleBlocks'), { ssr: false, loading: Placeholder }),
  'marble-bath': dynamic(() => import('./effects/MarbleBath'), { ssr: false, loading: Placeholder }),
  'moire-type': dynamic(() => import('./effects/MoireType'), { ssr: false, loading: Placeholder }),
  'leader-count': dynamic(() => import('./effects/Leader'), { ssr: false, loading: Placeholder }),
  'transit-stamp': dynamic(() => import('./effects/Transit'), { ssr: false, loading: Placeholder }),
  'ember-type': dynamic(() => import('./effects/EmberType'), { ssr: false, loading: Placeholder }),
  'echo-trail': dynamic(() => import('./effects/EchoTrail'), { ssr: false, loading: Placeholder }),
};

export default function EffectLoader({ slug, ...props }) {
  const Cmp = MAP[slug];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}

export const EFFECT_SLUGS = Object.keys(MAP);
