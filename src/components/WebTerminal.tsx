/**
 * WebTerminal — terminal Linux real embebida en el browser.
 *
 * Flujo:
 *   xterm.js (UI) <──WebSocket──> ttyd (en el contenedor Docker) <──pty──> bash
 *
 * Requiere que el contenedor tenga ttyd corriendo, por ejemplo:
 *   docker run ... ttyd -p 7681 bash
 *   docker exec <id> ttyd -p 7681 -W bash   (dentro del contenedor)
 *
 * ttyd expone WebSocket en:  ws://<host>:<port>/ws
 *
 * Protocolo ttyd (binario sobre WS):
 *   Client → Server:  [type_byte][data...]
 *     0x01 = INPUT  (teclas del usuario)
 *     0x02 = RESIZE (JSON: {"columns":80,"rows":24})
 *   Server → Client:  [type_byte][data...]
 *     0x01 = OUTPUT (bytes para mostrar en terminal)
 *     0x02 = SET_WINDOW_TITLE
 *     0x03 = SET_PREFS
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface WebTerminalProps {
    /** WebSocket URL del endpoint ttyd, ej: ws://10.0.0.100:7681/ws */
    wsUrl: string;
    /** Altura del área de terminal en px. Si es undefined, usa flex-1 */
    height?: number;
    className?: string;
}

type ConnState = 'connecting' | 'connected' | 'disconnected' | 'error';

/* Bytes del protocolo ttyd */
const TTYD_INPUT = '1';
const TTYD_RESIZE = '2';

export default function WebTerminal({ wsUrl, height = 460, className = '' }: WebTerminalProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const fitRef = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [connState, setConnState] = useState<ConnState>('connecting');

    /* ── Tear-down helper ──────────────────────────────────────── */
    const cleanup = useCallback(() => {
        wsRef.current?.close();
        wsRef.current = null;
        termRef.current?.dispose();
        termRef.current = null;
    }, []);

    /* ── Send resize to ttyd ───────────────────────────────────── */
    const sendResize = useCallback((cols: number, rows: number) => {
        const ws = wsRef.current;
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(TTYD_RESIZE + JSON.stringify({ columns: cols, rows }));
        }
    }, []);

    /* ── Boot xterm + WebSocket ────────────────────────────────── */
    useEffect(() => {
        if (!containerRef.current) return;

        /* xterm.js */
        const term = new Terminal({
            cursorBlink: true,
            fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
            fontSize: 14,
            lineHeight: 1.3,
            theme: {
                background: '#050505',
                foreground: '#00ff41',
                cursor: '#00ff41',
                cursorAccent: '#050505',
                selectionBackground: 'rgba(0,255,65,0.25)',
                black: '#000000',
                red: '#ff4444',
                green: '#00ff41',
                yellow: '#ffbb00',
                blue: '#4466ff',
                magenta: '#cc00ff',
                cyan: '#00ffff',
                white: '#cccccc',
                brightBlack: '#555555',
                brightRed: '#ff6666',
                brightGreen: '#66ff66',
                brightYellow: '#ffdd44',
                brightBlue: '#6688ff',
                brightMagenta: '#dd44ff',
                brightCyan: '#44ffff',
                brightWhite: '#ffffff',
            },
            allowTransparency: true,
            scrollback: 1000,
        });

        const fitAddon = new FitAddon();
        const linksAddon = new WebLinksAddon();
        term.loadAddon(fitAddon);
        term.loadAddon(linksAddon);
        term.open(containerRef.current);

        /* Ajustar tamaño inicial */
        requestAnimationFrame(() => {
            fitAddon.fit();
        });

        termRef.current = term;
        fitRef.current = fitAddon;

        /* WebSocket → ttyd */
        let ws: WebSocket;
        try {
            ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';
            wsRef.current = ws;
        } catch {
            term.writeln('\r\n\x1b[31m[ERROR] No se pudo abrir WebSocket: ' + wsUrl + '\x1b[0m');
            setConnState('error');
            return cleanup;
        }

        ws.onopen = () => {
            setConnState('connected');
            /* Enviar tamaño de ventana inicial */
            const { cols, rows } = term;
            sendResize(cols, rows);
        };

        ws.onmessage = (ev) => {
            const data = ev.data;
            if (typeof data === 'string') {
                /* texto plano: primer carácter es tipo */
                const type = data[0];
                const body = data.slice(1);
                if (type === '1') term.write(body);          // OUTPUT
            } else {
                /* ArrayBuffer: decodificar */
                const view = new Uint8Array(data as ArrayBuffer);
                const type = String.fromCharCode(view[0]);
                const body = new TextDecoder().decode(view.slice(1));
                if (type === '1') term.write(body);
            }
        };

        ws.onerror = () => {
            setConnState('error');
            term.writeln('\r\n\x1b[31m[WebSocket ERROR] No se pudo conectar a: ' + wsUrl + '\x1b[0m');
            term.writeln('\x1b[33mVerifica que ttyd esté corriendo en el contenedor.\x1b[0m');
            term.writeln('\x1b[90mEjemplo: docker exec -it <id> ttyd -p 7681 -W bash\x1b[0m');
        };

        ws.onclose = (ev) => {
            setConnState('disconnected');
            term.writeln('\r\n\x1b[33m[Sesión cerrada ' + (ev.reason ? ': ' + ev.reason : '') + ']\x1b[0m');
        };

        /* Teclado → ttyd (INPUT) */
        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(TTYD_INPUT + data);
            }
        });

        /* Resize de ventana */
        const onResize = () => {
            fitAddon.fit();
            const { cols, rows } = term;
            sendResize(cols, rows);
        };
        term.onResize(({ cols, rows }) => sendResize(cols, rows));
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wsUrl]);

    /* ── Reconectar ────────────────────────────────────────────── */
    const reconnect = () => {
        cleanup();
        setConnState('connecting');
        /* re-mount forzando desmontaje/montaje vía key — el parent lo maneja */
        window.location.reload();
    };

    /* ── Render ────────────────────────────────────────────────── */
    const statusBar = (() => {
        switch (connState) {
            case 'connecting':
                return (
                    <span className="flex items-center gap-1.5 text-yellow-400">
                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        CONNECTING...
                    </span>
                );
            case 'connected':
                return (
                    <span className="flex items-center gap-1.5 text-[#00ff41]">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#00ff41] animate-pulse" />
                        CONNECTED · {wsUrl}
                    </span>
                );
            case 'disconnected':
                return (
                    <span className="flex items-center gap-1.5 text-[#00ff41]/50">
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-500" />
                        DISCONNECTED
                    </span>
                );
            case 'error':
                return (
                    <span className="flex items-center gap-1.5 text-red-400">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                        CONNECTION ERROR
                    </span>
                );
        }
    })();

    return (
        <div className={`flex flex-col bg-[#050505] rounded-xl overflow-hidden border border-[#00ff41]/30 shadow-[0_0_30px_rgba(0,255,65,0.08)] ${className}`}>
            {/* ── Title bar (estilo macOS) ── */}
            <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#00ff41]/[0.06] border-b border-[#00ff41]/20">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    </div>
                    <span className="ml-1 text-[10px] font-mono font-bold tracking-widest text-[#00ff41]/60 uppercase">
                        bash — container shell
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                    {statusBar}
                    {(connState === 'error' || connState === 'disconnected') && (
                        <button
                            onClick={reconnect}
                            className="px-2 py-0.5 rounded border border-[#00ff41]/30 text-[#00ff41]/60 hover:text-[#00ff41] hover:bg-[#00ff41]/10 transition-colors"
                        >
                            ↺ Reconnect
                        </button>
                    )}
                </div>
            </div>

            {/* ── xterm.js container ── */}
            <div
                ref={containerRef}
                style={height !== undefined ? { height } : undefined}
                className={`overflow-hidden p-2 ${height === undefined ? 'flex-1' : ''}`}
            />
        </div>
    );
}
