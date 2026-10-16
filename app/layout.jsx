import './globals.css';

export const metadata = {
  title: { default: 'Playground — interactive studies', template: '%s — Playground' },
  description:
    'A workshop of original interactive effects: typography, shaders, microinteractions and generative canvases. Each one is a self-contained React component with no dependencies.',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#ffffff' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
