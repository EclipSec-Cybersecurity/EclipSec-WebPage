/**
 * Challenge definitions with Docker container connection info.
 *
 * Architecture:
 *   Frontend (eclipsec.cl) ──► ctf/challenge/:id
 *       • WEB  → iframe embebida apuntando a http://<host>:<port>
 *       • NC   → muestra `nc <host> <port>` + WebTerminal vía wtyd (wsPort)
 *       • SSH  → muestra `ssh user@<host> -p <port>` + WebTerminal vía ttyd
 *       • FILE → botón de descarga
 *
 * Cómo exponer una terminal del contenedor:
 *   En el Dockerfile (o al levantar el contenedor) agrega ttyd:
 *     apt install ttyd  (o: wget la release de ttyd)
 *     ttyd -p <wsPort> -W bash &
 *
 *   Ejemplo docker-compose:
 *     ports:
 *       - "8001:80"    # web challenge
 *       - "7681:7681"  # ttyd terminal
 */

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'INSANE';
export type Category = 'WEB' | 'CRYPTO' | 'FORENSICS' | 'PWN' | 'MISC';
export type ConnectionType = 'web' | 'nc' | 'ssh' | 'file';

export interface ChallengeConnection {
    /** Tipo de acceso principal al reto */
    type: ConnectionType;
    /** IP/hostname del servidor universitario */
    host: string;
    /** Puerto del servicio del reto (web app / nc / ssh) */
    port: number;
    /** URL completa del reto (opcional, sobrescribe host:port) */
    url?: string;
    /** Puerto de ttyd en el contenedor (WebSocket terminal).
     *  Si se define, aparece una terminal Linux real embebida en la página.
     *  wsUrl = ws://<host>:<wsPort>/ws  */
    wsPort?: number;
    /** Info adicional (ej: credenciales SSH, ruta de descarga) */
    extra?: string;
}

export interface Challenge {
    id: string;
    title: string;
    category: Category;
    difficulty: Difficulty;
    points: number;
    description: string;
    solves: number;
    author: string;
    connection: ChallengeConnection;
    hints?: string[];
    flagFormat?: string;
    /** Flag para validación (opcional en frontend, idealmente en backend) */
    flag?: string;
    /** true = contenedor corriendo; false = offline */
    active: boolean;
}

/* ─────────────────────────────────────────────────────────────────
 * Configuración del servidor universitario
 * Cambia host a la IP real del server cuando lo desplegues.
 * ───────────────────────────────────────────────────────────────── */
export const CTF_SERVER = {
    host: 'localhost',          // ← en prod: IP del servidor UCN, ej. '10.20.30.40'
    webBaseUrl: 'http://localhost',
} as const;

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
    EASY: 0, MEDIUM: 1, HARD: 2, INSANE: 3,
};

/* ─────────────────────────────────────────────────────────────────
 * Lista de retos
 *
 * wsPort = puerto donde ttyd escucha DENTRO del contenedor
 *   (debe estar expuesto en el docker-compose/run como -p wsPort:wsPort)
 * ───────────────────────────────────────────────────────────────── */
export const challenges: Challenge[] = [

    // ══════════════════════════════════════════════════════ EASY ══
    {
        id: 'web-001',
        title: 'Reto 1: Hidden in Plain Sight',
        category: 'WEB',
        difficulty: 'EASY',
        points: 100,
        description: 'A veces la información más importante se esconde donde todos pueden ver. Inspecciona el código fuente.',
        solves: 87,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8001,
            url: 'https://academiahackingucncqbo-production.up.railway.app/',
            // sin wsPort → no muestra panel de terminal
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{h1dd3n_1n_pl41n_s1ght}',
        hints: ['¿Has revisado el HTML?', 'Los comentarios a veces dicen mucho...'],
        active: true,
    },
    {
        id: 'crypto-001',
        title: 'Caesar Salad',
        category: 'CRYPTO',
        difficulty: 'EASY',
        points: 100,
        description: 'Un mensaje cifrado con una técnica antigua. ¿Puedes descifrar el texto oculto?',
        solves: 92,
        author: 'EclipSec',
        connection: {
            type: 'file',
            host: CTF_SERVER.host,
            port: 8002,
            extra: '/downloads/caesar_salad.txt',
        },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'misc-001',
        title: 'Base64 Layers',
        category: 'MISC',
        difficulty: 'EASY',
        points: 100,
        description: 'Múltiples capas de codificación protegen esta flag. Desenvuelve todas las capas.',
        solves: 78,
        author: 'EclipSec',
        connection: {
            type: 'nc',
            host: CTF_SERVER.host,
            port: 8003,
            wsPort: 7683,
        },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'forensics-001',
        title: 'Metadata Leak',
        category: 'FORENSICS',
        difficulty: 'EASY',
        points: 150,
        description: 'Una imagen aparentemente normal contiene secretos en sus metadatos EXIF.',
        solves: 65,
        author: 'EclipSec',
        connection: {
            type: 'file',
            host: CTF_SERVER.host,
            port: 8004,
            extra: '/downloads/metadata_leak.jpg',
        },
        flagFormat: 'EclipSec{...}',
        active: true,
    },

    // ════════════════════════════════════════════════════ MEDIUM ══
    {
        id: 'web-002',
        title: 'Cookie Monster',
        category: 'WEB',
        difficulty: 'MEDIUM',
        points: 250,
        description: 'La autenticación de este sitio tiene una debilidad. Manipula las cookies para escalar privilegios.',
        solves: 43,
        author: 'EclipSec',
        connection: { type: 'web', host: CTF_SERVER.host, port: 8005, wsPort: 7685 },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'web-003',
        title: 'SQL Injection 101',
        category: 'WEB',
        difficulty: 'MEDIUM',
        points: 300,
        description: 'Un formulario de login vulnerable. Bypasea la autenticación usando inyección SQL.',
        solves: 38,
        author: 'EclipSec',
        connection: { type: 'web', host: CTF_SERVER.host, port: 8006, wsPort: 7686 },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'crypto-002',
        title: 'XOR Enigma',
        category: 'CRYPTO',
        difficulty: 'MEDIUM',
        points: 250,
        description: 'Un archivo fue cifrado con XOR usando una clave repetida. Encuentra el patrón y descifra.',
        solves: 31,
        author: 'EclipSec',
        connection: { type: 'nc', host: CTF_SERVER.host, port: 8007, wsPort: 7687 },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'forensics-002',
        title: 'Packet Hunter',
        category: 'FORENSICS',
        difficulty: 'MEDIUM',
        points: 300,
        description: 'Analiza la captura de red .pcap y encuentra las credenciales transmitidas en texto plano.',
        solves: 29,
        author: 'EclipSec',
        connection: {
            type: 'file',
            host: CTF_SERVER.host,
            port: 8008,
            extra: '/downloads/capture.pcap',
        },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'pwn-001',
        title: 'Buffer Overflow Basics',
        category: 'PWN',
        difficulty: 'MEDIUM',
        points: 350,
        description: 'Un binario con un buffer overflow clásico. Sobrescribe la dirección de retorno.',
        solves: 22,
        author: 'EclipSec',
        connection: { type: 'nc', host: CTF_SERVER.host, port: 8009, wsPort: 7689 },
        flagFormat: 'EclipSec{...}',
        hints: ['¿Cuántos bytes necesitas para llegar al EIP?'],
        active: true,
    },

    // ══════════════════════════════════════════════════════ HARD ══
    {
        id: 'web-004',
        title: 'SSTI Escape',
        category: 'WEB',
        difficulty: 'HARD',
        points: 500,
        description: 'El motor de plantillas del servidor es vulnerable. Logra ejecución de código remoto via SSTI.',
        solves: 11,
        author: 'EclipSec',
        connection: { type: 'web', host: CTF_SERVER.host, port: 8010, wsPort: 7690 },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'crypto-003',
        title: 'RSA Weak Keys',
        category: 'CRYPTO',
        difficulty: 'HARD',
        points: 500,
        description: 'Las claves RSA generadas tienen un defecto. Factoriza el módulo y descifra el mensaje.',
        solves: 8,
        author: 'EclipSec',
        connection: { type: 'nc', host: CTF_SERVER.host, port: 8011, wsPort: 7691 },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'pwn-002',
        title: 'ROP Chain Builder',
        category: 'PWN',
        difficulty: 'HARD',
        points: 600,
        description: 'NX está habilitado. Construye una cadena ROP para ejecutar /bin/sh en el servidor.',
        solves: 6,
        author: 'EclipSec',
        connection: { type: 'nc', host: CTF_SERVER.host, port: 8012, wsPort: 7692 },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'forensics-003',
        title: 'Memory Dump Analysis',
        category: 'FORENSICS',
        difficulty: 'HARD',
        points: 550,
        description: 'Analiza un volcado de memoria RAM y extrae la flag oculta en un proceso sospechoso.',
        solves: 9,
        author: 'EclipSec',
        connection: {
            type: 'ssh',
            host: CTF_SERVER.host,
            port: 8013,
            wsPort: 7693,
            extra: 'user: analyst / pass: volatility',
        },
        flagFormat: 'EclipSec{...}',
        active: true,
    },

    // ════════════════════════════════════════════════════ INSANE ══
    {
        id: 'pwn-003',
        title: 'Kernel Exploit',
        category: 'PWN',
        difficulty: 'INSANE',
        points: 1000,
        description: 'Escala privilegios explotando una vulnerabilidad en un módulo del kernel custom.',
        solves: 2,
        author: 'EclipSec',
        connection: {
            type: 'ssh',
            host: CTF_SERVER.host,
            port: 8014,
            wsPort: 7694,
            extra: 'user: pwner / pass: challenge',
        },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
    {
        id: 'web-005',
        title: 'Full Chain RCE',
        category: 'WEB',
        difficulty: 'INSANE',
        points: 1000,
        description: 'Encadena múltiples vulnerabilidades: SSRF → LFI → Deserialización → RCE.',
        solves: 1,
        author: 'EclipSec',
        connection: { type: 'web', host: CTF_SERVER.host, port: 8015, wsPort: 7695 },
        flagFormat: 'EclipSec{...}',
        active: true,
    },
];

export const sortedChallenges = [...challenges].sort(
    (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
);
