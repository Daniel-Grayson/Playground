'use client';

import dynamic from 'next/dynamic';

// Nothing here server-renders: the canvas effects open a context and the DOM
// ones measure layout. Lazy loading also means the page ships only what it
// shows. next/dynamic needs an inline object literal, hence the repetition.
function Placeholder() {
  return <div style={{ width: '100%', height: '100%' }} />;
}

const MAP = {
  'ember-type': dynamic(() => import('./effects/EmberType'), { ssr: false, loading: Placeholder }),
  'cascade-menu': dynamic(() => import('./effects/CascadeMenu'), { ssr: false, loading: Placeholder }),
  'ribbon-type': dynamic(() => import('./effects/RibbonType'), { ssr: false, loading: Placeholder }),
  'integration-orbit': dynamic(() => import('./effects/IntegrationOrbit'), { ssr: false, loading: Placeholder }),
  'shatter-type': dynamic(() => import('./effects/ShatterType'), { ssr: false, loading: Placeholder }),
  'glass-stack': dynamic(() => import('./effects/GlassStack'), { ssr: false, loading: Placeholder }),
  'echo-trail': dynamic(() => import('./effects/EchoTrail'), { ssr: false, loading: Placeholder }),
  'dock-magnify': dynamic(() => import('./effects/DockMagnify'), { ssr: false, loading: Placeholder }),
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
