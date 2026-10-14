// Documented parameter ranges, for picking values when lifting a component
// into another project. Flood type and Stamp type are driven entirely by
// their own params files instead.

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
  'echo-trail': [
    t('text', 'Word', 'ECHO'),
    r('echoes', 'Echoes', 34, 3, 90, 1),
    r('falloff', 'Falloff', 1.5, 0.3, 5),
    r('follow', 'Lag', 0.09, 0.01, 0.4),
  ],
};

export function defaultsFor(slug) {
  return Object.fromEntries((CONTROLS[slug] ?? []).map((c) => [c.key, c.value]));
}
