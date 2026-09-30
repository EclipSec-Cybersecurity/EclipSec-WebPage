import { useEffect, type ReactNode } from 'react';

export interface CtfPageShellProps {
  children: ReactNode;
}

/**
 * Shared chrome for the new CTF catalog pages: forces the dark terminal theme,
 * renders the decorative grid + scanline layers and the centered content
 * wrapper. Existing CTF pages keep their own inline copies on purpose.
 */
export function CtfPageShell({ children }: CtfPageShellProps) {
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const root = document.getElementById('root');
    const origBodyBg = body.style.backgroundColor;
    const origBodyColor = body.style.color;
    const origHtmlBg = html.style.backgroundColor;
    const origRootBg = root?.style.backgroundColor || '';
    const origOverflow = body.style.overflow;
    body.style.backgroundColor = '#050505';
    body.style.color = '#00ff41';
    html.style.backgroundColor = '#050505';
    body.style.overflow = 'auto';
    if (root) root.style.backgroundColor = '#050505';
    return () => {
      body.style.backgroundColor = origBodyBg;
      body.style.color = origBodyColor;
      body.style.overflow = origOverflow;
      html.style.backgroundColor = origHtmlBg;
      if (root) root.style.backgroundColor = origRootBg;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono relative overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
