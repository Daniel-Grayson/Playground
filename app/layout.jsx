import './globals.css';

export const metadata = {
  title: { default: 'Playground — interactive studies', template: '%s — Playground' },
  description:
    'A workshop of original interactive studies, each built around a single mechanism and drawn on a canvas. Every one is a self-contained React component with no dependencies beyond React.',
};

// One entry, because the page is light in either scheme. The two-entry form
// this replaces gave the same #ffffff to both, which only looked deliberate.
export const viewport = { themeColor: '#ffffff' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
