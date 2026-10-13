'use client';

import dynamic from 'next/dynamic';

// Every effect measures the DOM or opens a canvas context, so none of them
// server-render. Loading them lazily also means a page ships only what it shows.
// next/dynamic requires the options to be an inline object literal, hence the
// repetition below.
function Placeholder() {
  return <div style={{ width: '100%', height: '100%', background: 'var(--surface-2)' }} />;
}

const MAP = {
  'ribbon-type': dynamic(() => import('./effects/RibbonType'), { ssr: false, loading: Placeholder }),
  'shatter-type': dynamic(() => import('./effects/ShatterType'), { ssr: false, loading: Placeholder }),
  'scramble-type': dynamic(() => import('./effects/ScrambleType'), { ssr: false, loading: Placeholder }),
  'gravity-type': dynamic(() => import('./effects/GravityType'), { ssr: false, loading: Placeholder }),
  'echo-trail': dynamic(() => import('./effects/EchoTrail'), { ssr: false, loading: Placeholder }),
  'halftone': dynamic(() => import('./effects/Halftone'), { ssr: false, loading: Placeholder }),
  'ascii': dynamic(() => import('./effects/Ascii'), { ssr: false, loading: Placeholder }),
  'dither': dynamic(() => import('./effects/Dither'), { ssr: false, loading: Placeholder }),
  'displace': dynamic(() => import('./effects/Displace'), { ssr: false, loading: Placeholder }),
  'magnetic-button': dynamic(() => import('./effects/MagneticButton'), { ssr: false, loading: Placeholder }),
  'squircle': dynamic(() => import('./effects/Squircle'), { ssr: false, loading: Placeholder }),
  'cursor-lens': dynamic(() => import('./effects/CursorLens'), { ssr: false, loading: Placeholder }),
  'morph-tabs': dynamic(() => import('./effects/MorphTabs'), { ssr: false, loading: Placeholder }),
  'flow-field': dynamic(() => import('./effects/FlowField'), { ssr: false, loading: Placeholder }),
  'dot-ripple': dynamic(() => import('./effects/DotRipple'), { ssr: false, loading: Placeholder }),
  'mesh-gradient': dynamic(() => import('./effects/MeshGradient'), { ssr: false, loading: Placeholder }),
  'orbit-field': dynamic(() => import('./effects/OrbitField'), { ssr: false, loading: Placeholder }),
};

export default function EffectLoader({ slug, ...props }) {
  const Cmp = MAP[slug];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}

export const EFFECT_SLUGS = Object.keys(MAP);
