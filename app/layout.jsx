import './globals.css';

export const metadata = {
  title: { default: 'Vault — interactive studies', template: '%s — Vault' },
  description:
    'A workshop of original interactive effects: typography, shaders, microinteractions and generative canvases. Each one is a self-contained React component with no dependencies.',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbfa' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0c0b' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
