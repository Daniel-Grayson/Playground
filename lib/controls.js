// Live controls per effect. Keys must match the component's prop names —
// the studio spreads this straight into the component.

const t = (key, label, value) => ({ key, label, type: 'text', value });
const r = (key, label, value, min, max, step = 0.01) => ({
  key, label, type: 'range', value, min, max, step,
});
const b = (key, label, value) => ({ key, label, type: 'bool', value });
const s = (key, label, value, options) => ({ key, label, type: 'select', value, options });

export const CONTROLS = {
  'ribbon-type': [
    t('text', 'Word', 'RIBBON'),
    r('twist', 'Twist', 1.1, 0, 3.14),
    r('speed', 'Speed', 0.5, 0, 2),
    r('wavelength', 'Wavelength', 1.6, 0.3, 4),
    r('slices', 'Slices', 180, 12, 400, 1),
  ],
  'shatter-type': [
    t('text', 'Word', 'SHATTER'),
    r('tiles', 'Columns', 26, 6, 60, 1),
    r('force', 'Force', 1, 0, 3),
    r('springback', 'Spring back', 0.18, 0.05, 0.8),
    r('spin', 'Spin', 1, 0, 3),
  ],
  'scramble-type': [
    t('text', 'Text', 'SCRAMBLE'),
    r('speed', 'Speed', 1, 0.2, 3),
    r('stagger', 'Stagger', 0.6, 0, 2),
    r('reseedHz', 'Churn rate', 14, 2, 40, 1),
  ],
  'gravity-type': [
    t('text', 'Word', 'GRAVITY'),
    r('gravity', 'Gravity', 1700, 200, 4000, 10),
    r('bounce', 'Bounce', 0.32, 0, 0.9),
    r('friction', 'Friction', 0.86, 0.5, 1),
  ],
  'echo-trail': [
    t('text', 'Word', 'ECHO'),
    r('echoes', 'Echoes', 34, 3, 90, 1),
    r('falloff', 'Falloff', 1.5, 0.3, 5),
    r('follow', 'Lag', 0.09, 0.01, 0.4),
  ],
  halftone: [
    t('text', 'Word', 'VAULT'),
    r('cell', 'Screen ruling', 7, 3, 24, 0.5),
    r('angle', 'Rotation', 0, 0, 1.57),
    r('contrast', 'Contrast', 1.35, 0.5, 3),
    r('sharp', 'Dot hardness', 0.45, 0, 1),
  ],
  ascii: [
    t('text', 'Word', 'VAULT'),
    r('cell', 'Cell size', 11, 5, 30, 0.5),
    s('charset', 'Character set', 'classic', ['classic', 'blocks', 'dense', 'binary']),
    r('tint', 'Colour', 1, 0, 1),
    r('gamma', 'Gamma', 1.6, 0.3, 3),
  ],
  dither: [
    t('text', 'Word', 'VAULT'),
    r('levels', 'Levels', 3, 2, 8, 1),
    s('matrix', 'Bayer size', 8, [2, 4, 8]),
    r('scale', 'Pixel scale', 2, 1, 8, 1),
    b('mono', 'Monochrome', false),
  ],
  displace: [
    t('text', 'Word', 'VAULT'),
    r('strength', 'Strength', 0.055, 0, 0.2, 0.001),
    r('radius', 'Radius', 0.3, 0.05, 0.9),
    r('aberration', 'Aberration', 0.35, 0, 1),
  ],
  'magnetic-button': [
    t('label', 'Label', 'Get in touch'),
    r('pull', 'Pull', 0.42, 0, 1),
    r('stiffness', 'Stiffness', 170, 40, 500, 1),
    r('parallax', 'Label parallax', 1.8, 1, 3),
    r('hitPadding', 'Field size', 60, 0, 160, 1),
  ],
  squircle: [
    r('n', 'Exponent n', 4, 2, 12, 0.1),
    b('compare', 'Show border-radius beside it', true),
  ],
  'cursor-lens': [
    t('text', 'Text', 'LOOK CLOSER'),
    r('size', 'Lens size', 150, 60, 320, 1),
    r('zoom', 'Magnification', 1.9, 1, 3.5),
    r('rings', 'Rings', 34, 8, 70, 1),
    b('invert', 'Invert', true),
  ],
  'morph-tabs': [
    r('stiffness', 'Stiffness', 220, 60, 600, 1),
    r('stretch', 'Stretch', 0.3, 0, 1),
    r('damping', 'Damping', 0.8, 0.3, 1.4),
  ],
  'flow-field': [
    r('count', 'Particles', 1400, 200, 4000, 50),
    r('scale', 'Field scale', 1.5, 0.3, 5),
    r('speed', 'Speed', 1, 0.1, 3),
    r('fade', 'Trail fade', 0.055, 0.005, 0.4, 0.005),
    r('pointerForce', 'Pointer force', 1, 0, 3),
  ],
  'dot-ripple': [
    r('spacing', 'Spacing', 26, 12, 60, 1),
    r('speed', 'Wave speed', 420, 80, 1200, 10),
    r('amplitude', 'Amplitude', 16, 0, 50, 1),
    r('width', 'Wave width', 90, 20, 240, 1),
    r('dotSize', 'Dot size', 2, 0.5, 6, 0.1),
  ],
  'mesh-gradient': [
    r('warp', 'Warp', 0.55, 0, 1.5),
    r('speed', 'Speed', 1, 0.1, 3),
    r('grain', 'Grain', 0.035, 0, 0.12, 0.002),
  ],
  'orbit-field': [
    r('count', 'Points', 720, 100, 2500, 10),
    r('speed', 'Speed', 0.3, 0, 1.5),
    r('tilt', 'Tilt', 0.42, -1, 1),
    r('dotSize', 'Dot size', 1.9, 0.5, 5, 0.1),
  ],
};

export function defaultsFor(slug) {
  return Object.fromEntries((CONTROLS[slug] ?? []).map((c) => [c.key, c.value]));
}
