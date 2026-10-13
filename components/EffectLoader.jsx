'use client';

import dynamic from 'next/dynamic';

// Every effect opens a canvas context, so none of them server-render. Loading
// them lazily also means the page ships only what it shows. next/dynamic needs
// the options to be an inline object literal, hence the repetition.
function Placeholder() {
  return <div style={{ width: '100%', height: '100%' }} />;
}

const MAP = {
  'ember-type': dynamic(() => import('./effects/EmberType'), { ssr: false, loading: Placeholder }),
  'ribbon-type': dynamic(() => import('./effects/RibbonType'), { ssr: false, loading: Placeholder }),
  'shatter-type': dynamic(() => import('./effects/ShatterType'), { ssr: false, loading: Placeholder }),
  'echo-trail': dynamic(() => import('./effects/EchoTrail'), { ssr: false, loading: Placeholder }),
  'confetti-burst': dynamic(() => import('./effects/ConfettiBurst'), { ssr: false, loading: Placeholder }),
  'flow-field': dynamic(() => import('./effects/FlowField'), { ssr: false, loading: Placeholder }),
  'dot-ripple': dynamic(() => import('./effects/DotRipple'), { ssr: false, loading: Placeholder }),
  'orbit-field': dynamic(() => import('./effects/OrbitField'), { ssr: false, loading: Placeholder }),
};

export default function EffectLoader({ slug, ...props }) {
  const Cmp = MAP[slug];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}

export const EFFECT_SLUGS = Object.keys(MAP);
