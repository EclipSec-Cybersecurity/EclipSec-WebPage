import { Loader2, RefreshCw, Shield } from 'lucide-react';

export interface CtfLoadingStateProps {
  message?: string;
}

export function CtfLoadingState({ message = 'Cargando ...' }: CtfLoadingStateProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#00ff41]" />
        <p className="text-sm tracking-widest uppercase">{message}</p>
      </div>
    </div>
  );
}

export interface CtfErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function CtfErrorState({ message, onRetry }: CtfErrorStateProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="border border-red-500/40 bg-red-950/20 rounded-xl p-6 max-w-md w-full text-center">
        <p className="text-red-400 font-bold">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/20"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export interface CtfEmptyStateProps {
  title: string;
  hint?: string;
}

export function CtfEmptyState({ title, hint }: CtfEmptyStateProps) {
  return (
    <div className="border border-dashed border-[#00ff41]/20 rounded-2xl p-12 text-center bg-[#0a0a0a]/50">
      <Shield className="w-12 h-12 mx-auto mb-3 text-[#00ff41] animate-pulse" />
      <p className="text-sm font-bold tracking-widest uppercase text-white">{title}</p>
      {hint && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
