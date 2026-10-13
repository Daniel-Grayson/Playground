// Documented parameter ranges per effect. The page renders each effect at its
// defaults; this is the reference for picking values when you lift one into
// another project.

const t = (key, label, value) => ({ key, label, type: 'text', value });
const r = (key, label, value, min, max, step = 0.01) => ({
  key, label, type: 'range', value, min, max, step,
});

export const CONTROLS = {
  'ember-type': [
    t('text', 'Word', 'EMBER'),
    r('cols', 'Grid width', 150, 60, 300, 1),
    r('heat', 'Heat levels', 36, 12, 64, 1),
    r('drift', 'Sideways drift', 1, 0, 2, 1),
  ],
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
  'echo-trail': [
    t('text', 'Word', 'ECHO'),
    r('echoes', 'Echoes', 34, 3, 90, 1),
    r('falloff', 'Falloff', 1.5, 0.3, 5),
    r('follow', 'Lag', 0.09, 0.01, 0.4),
  ],
  'confetti-burst': [
    r('count', 'Scraps per burst', 90, 20, 240, 5),
    r('gravity', 'Gravity', 620, 150, 1600, 10),
    r('spread', 'Throw speed', 440, 100, 900, 10),
    r('interval', 'Seconds between bursts', 2.1, 0.8, 6, 0.1),
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
    r('dotSize', 'Dot size', 2.4, 0.5, 6, 0.1),
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
