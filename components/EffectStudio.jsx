'use client';

import { useState } from 'react';
import EffectLoader from './EffectLoader';
import { CONTROLS, defaultsFor } from '@/lib/controls';

/** Stage + live parameter panel for one effect. */
export default function EffectStudio({ slug }) {
  const controls = CONTROLS[slug] ?? [];
  const [props, setProps] = useState(() => defaultsFor(slug));

  const set = (key, value) => setProps((p) => ({ ...p, [key]: value }));
  const reset = () => setProps(defaultsFor(slug));

  return (
    <div className="studio">
      <div className="stage">
        <EffectLoader slug={slug} {...props} />
      </div>

      {controls.length > 0 && (
        <div className="panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <span className="mono">Parameters</span>
            <button type="button" className="btn" onClick={reset} style={{ padding: '5px 9px' }}>
              Reset
            </button>
          </div>

          {controls.map((c) => (
            <Control key={c.key} control={c} value={props[c.key]} onChange={set} />
          ))}
        </div>
      )}
    </div>
  );
}

function Control({ control: c, value, onChange }) {
  if (c.type === 'text') {
    return (
      <div className="ctl">
        <label className="ctl-label" htmlFor={c.key}>{c.label}</label>
        <span />
        <input
          id={c.key}
          type="text"
          value={value ?? ''}
          maxLength={28}
          onChange={(e) => onChange(c.key, e.target.value)}
        />
      </div>
    );
  }

  if (c.type === 'bool') {
    return (
      <div className="ctl" style={{ gridTemplateColumns: '1fr auto', marginBottom: 14 }}>
        <label className="ctl-label" htmlFor={c.key}>{c.label}</label>
        <input
          id={c.key}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(c.key, e.target.checked)}
          style={{ accentColor: 'var(--text)', width: 16, height: 16 }}
        />
      </div>
    );
  }

  if (c.type === 'select') {
    return (
      <div className="ctl" style={{ gridTemplateColumns: '1fr auto' }}>
        <label className="ctl-label" htmlFor={c.key}>{c.label}</label>
        <select
          id={c.key}
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const n = Number(raw);
            onChange(c.key, Number.isNaN(n) || raw === '' ? raw : n);
          }}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            padding: '5px 7px',
            borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text)',
          }}
        >
          {c.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  const decimals = c.step >= 1 ? 0 : String(c.step).split('.')[1]?.length ?? 2;
  return (
    <div className="ctl">
      <label className="ctl-label" htmlFor={c.key}>{c.label}</label>
      <span className="ctl-value">{Number(value).toFixed(decimals)}</span>
      <input
        id={c.key}
        type="range"
        min={c.min}
        max={c.max}
        step={c.step}
        value={value}
        onChange={(e) => onChange(c.key, Number(e.target.value))}
      />
    </div>
  );
}
