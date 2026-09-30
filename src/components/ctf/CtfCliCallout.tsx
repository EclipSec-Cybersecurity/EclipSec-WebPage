import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

export interface CtfCliCalloutProps {
  challengeId: string;
}

/**
 * Preview of the planned local workflow. It only renders a command and lets the
 * user copy it — no API call, no remote instance.
 */
export function CtfCliCallout({ challengeId }: CtfCliCalloutProps) {
  const [copied, setCopied] = useState(false);
  const command = `eclipsec challenge start ${challengeId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // jsdom and non-secure contexts have no clipboard API: fail silently.
    }
  };

  return (
    <div className="bg-[#0a0a0a]/95 border border-[#00ff41]/20 p-4 flex flex-col rounded-2xl backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-4 h-4 text-[#00ff41]" />
        <h2 className="text-sm font-black tracking-widest uppercase text-white">EclipSec CLI</h2>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-3">
        Este challenge se ejecuta <strong className="text-[#00ff41]">localmente</strong> en tu
        máquina mediante la EclipSec CLI: la herramienta descarga el entorno del challenge y lo
        levanta en tu equipo, sin instancias remotas.
      </p>

      <div className="flex items-start gap-2">
        <pre className="flex-1 bg-black border border-[#00ff41]/30 rounded-xl p-3 text-xs overflow-x-auto">
          <code className="text-[#00ff41]">{command}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar comando"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <p className="mt-3 text-xs text-yellow-400/90 leading-relaxed">
        Aviso: la EclipSec CLI está todavía en desarrollo y aún no está disponible para descarga.
        Este comando es una vista previa del flujo previsto y por ahora no funciona.
      </p>
    </div>
  );
}
