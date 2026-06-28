/**
 * Challenge definitions with Docker container connection info.
 *
 * Architecture (Monolítico en Railway):
 *   Un solo contenedor con Nginx como reverse proxy.
 *   Todas las apps Flask corren en puertos internos (800X).
 *   Nginx enruta /web-XXX/ → 127.0.0.1:800X
 *   Nginx enruta /web-XXX/ws/ → ttyd en 127.0.0.1:768X
 *
 *   Frontend (eclipsec.cl) ──► ctf/challenge/:id
 *       • WEB  → iframe embebida apuntando a url del reto
 *       • Terminal → WebSocket a wss://domain/web-XXX/ws
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
    /** URL completa del reto (obligatorio para Railway monolítico) */
    url?: string;
    /** URL del WebSocket de ttyd (obligatorio para Railway monolítico) */
    wsUrl?: string;
    /** Puerto de ttyd en el contenedor (WebSocket terminal) — solo para docker local */
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
 * Configuración del servidor
 *
 * Railway monolítico: todos los retos están bajo un mismo dominio
 * con sub-rutas /web-001/, /web-002/, etc.
 * ───────────────────────────────────────────────────────────────── */
const RAILWAY_DOMAIN = 'https://academiahackingucncqbo-production.up.railway.app';

export const CTF_SERVER = {
    host: 'academiahackingucncqbo-production.up.railway.app',
    railwayDomain: RAILWAY_DOMAIN,
} as const;

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
    EASY: 0, MEDIUM: 1, HARD: 2, INSANE: 3,
};

/* ─────────────────────────────────────────────────────────────────
 * Helper: genera URL del reto y WebSocket para el monolítico
 * ───────────────────────────────────────────────────────────────── */
const railwayChallenge = (id: string) => ({
    url: `${RAILWAY_DOMAIN}/${id}/`,
    wsUrl: `wss://${CTF_SERVER.host}/${id}/ws`,
});

/* ─────────────────────────────────────────────────────────────────
 * Lista de retos
 *
 * Cada reto corresponde a una sub-ruta en el monolítico:
 *   https://academiahackingucncqbo-production.up.railway.app/web-XXX/
 *
 * Terminal WebSocket:
 *   wss://academiahackingucncqbo-production.up.railway.app/web-XXX/ws
 * ───────────────────────────────────────────────────────────────── */
export const challenges: Challenge[] = [

    // ══════════════════════════════════════════════════════ EASY ══

    // ── web-001: Hidden in Plain Sight ──────────────────────────
    {
        id: 'web-001',
        title: 'Reto 1: Hidden in Plain Sight',
        category: 'WEB',
        difficulty: 'EASY',
        points: 100,
        description: 'A veces la información más importante se esconde donde todos pueden ver. Inspecciona el código fuente de la página web de SecureCorp y encuentra la flag oculta.',
        solves: 87,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8001,
            ...railwayChallenge('web-001'),
        },
        flagFormat: 'EclipSec{...}',
        hints: ['¿Has revisado el HTML?', 'Los comentarios a veces dicen mucho...'],
        active: true,
    },

    // ── web-002: Robots & Crawlers ──────────────────────────────
    {
        id: 'web-002',
        title: 'Reto 2: Robots & Crawlers',
        category: 'WEB',
        difficulty: 'EASY',
        points: 100,
        description: 'Los motores de búsqueda siguen reglas. ¿Qué pasa cuando un archivo les dice a dónde NO deben ir? Revisa lo que los crawlers no deberían encontrar.',
        solves: 74,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8002,
            ...railwayChallenge('web-002'),
        },
        flagFormat: 'EclipSec{...}',
        hints: ['¿Conoces el archivo robots.txt?', 'Visita las rutas que están "prohibidas".'],
        active: true,
    },

    // ── web-003: Cookie Tampering ───────────────────────────────
    {
        id: 'web-003',
        title: 'Reto 3: Cookie Tampering',
        category: 'WEB',
        difficulty: 'EASY',
        points: 100,
        description: 'La autenticación de este sitio usa cookies para determinar tu rol. ¿Puedes manipular tu cookie para escalar privilegios de guest a admin?',
        solves: 68,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8003,
            ...railwayChallenge('web-003'),
        },
        flagFormat: 'EclipSec{...}',
        hints: ['Inspecciona las cookies del sitio con DevTools.', 'Cambia el valor de la cookie "role" a algo más poderoso.'],
        active: true,
    },

    // ── web-009: Source Code Leak ────────────────────────────────
    {
        id: 'web-009',
        title: 'Reto 4: Source Code Leak',
        category: 'WEB',
        difficulty: 'EASY',
        points: 150,
        description: 'Los desarrolladores a veces dejan archivos de respaldo en el servidor. Busca archivos .bak u otros backups que no deberían estar expuestos.',
        solves: 55,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8009,
            ...railwayChallenge('web-009'),
        },
        flagFormat: 'EclipSec{...}',
        hints: ['¿Qué extensiones usan los archivos de respaldo?', 'Prueba con index.py.bak'],
        active: true,
    },

    // ══════════════════════════════════════════════════════ MEDIUM ══

    // ── web-004: Ping of Death ──────────────────────────────────
    {
        id: 'web-004',
        title: 'Reto 5: Ping of Death',
        category: 'WEB',
        difficulty: 'MEDIUM',
        points: 250,
        description: 'Una herramienta de diagnóstico de red permite hacer ping a direcciones IP. Pero, ¿qué pasa si inyectas algo más que una IP? Encuentra la forma de ejecutar comandos.',
        solves: 43,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8004,
            ...railwayChallenge('web-004'),
        },
        flagFormat: 'EclipSec{...}',
        hints: ['Intenta encadenar comandos con ; o |', 'Busca archivos interesantes con cat /flag.txt'],
        active: true,
    },

    // ── web-005: LFI to RCE ─────────────────────────────────────
    {
        id: 'web-005',
        title: 'Reto 6: LFI to RCE',
        category: 'WEB',
        difficulty: 'MEDIUM',
        points: 300,
        description: 'El servidor carga archivos locales según un parámetro GET. Explota la vulnerabilidad de Local File Inclusion para leer archivos del sistema y encontrar la flag.',
        solves: 35,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8005,
            ...railwayChallenge('web-005'),
        },
        flagFormat: 'EclipSec{...}',
        hints: ['Observa el parámetro ?file= en la URL.', 'Intenta leer /flag_web005.txt o /etc/passwd usando path traversal.'],
        active: true,
    },

    // ── web-006: SQLi Login Bypass ──────────────────────────────
    {
        id: 'web-006',
        title: 'Reto 7: SQLi Login Bypass',
        category: 'WEB',
        difficulty: 'MEDIUM',
        points: 300,
        description: 'Un formulario de login con una consulta SQL vulnerable. Bypassea la autenticación usando inyección SQL clásica para acceder como administrador.',
        solves: 38,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8006,
            ...railwayChallenge('web-006'),
        },
        flagFormat: 'EclipSec{...}',
        hints: ['Piensa en cómo romper una consulta SQL con comillas simples.', "Clásico: ' OR '1'='1' --"],
        active: true,
    },

    // ── web-007: IDOR Profiles ──────────────────────────────────
    {
        id: 'web-007',
        title: 'Reto 8: IDOR Profiles',
        category: 'WEB',
        difficulty: 'MEDIUM',
        points: 250,
        description: 'El sistema de perfiles permite ver usuarios por ID. ¿Puedes acceder a un perfil que no deberías ver? Explota la referencia directa insegura a objetos.',
        solves: 42,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8007,
            ...railwayChallenge('web-007'),
        },
        flagFormat: 'EclipSec{...}',
        hints: ['Observa el parámetro ?id= en la URL.', '¿Qué pasa si cambias el ID a 0?'],
        active: true,
    },

    // ── web-010: Headers Matter ─────────────────────────────────
    {
        id: 'web-010',
        title: 'Reto 9: Headers Matter',
        category: 'WEB',
        difficulty: 'MEDIUM',
        points: 300,
        description: 'El servidor solo permite acceso desde un navegador específico y una IP local. Manipula las cabeceras HTTP para pasar los controles de seguridad.',
        solves: 30,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8010,
            ...railwayChallenge('web-010'),
        },
        flagFormat: 'EclipSec{...}',
        hints: [
            'Necesitas modificar dos cabeceras HTTP.',
            'User-Agent: SecureBrowser1.0 y X-Forwarded-For: 127.0.0.1',
        ],
        active: true,
    },

    // ══════════════════════════════════════════════════════ HARD ══

    // ── web-008: Server-Side Template Injection ─────────────────
    {
        id: 'web-008',
        title: 'Reto 10: Server-Side Template Injection',
        category: 'WEB',
        difficulty: 'HARD',
        points: 500,
        description: 'El motor de plantillas del servidor es vulnerable a SSTI. Inyecta código en el parámetro de entrada para lograr ejecución de código y leer la flag desde las variables de entorno.',
        solves: 11,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8008,
            ...railwayChallenge('web-008'),
        },
        flagFormat: 'EclipSec{...}',
        hints: [
            'Prueba con {{7*7}} en el parámetro name.',
            'Busca clases de Python para acceder a os y leer variables de entorno.',
        ],
        active: true,
    },

    // ── web-011: Command Execution GET ──────────────────────────
    {
        id: 'web-011',
        title: 'Reto 11: Command Execution GET',
        category: 'WEB',
        difficulty: 'HARD',
        points: 500,
        description: 'Una consola de administración de debug expone ejecución de comandos a través de un parámetro GET. Encuentra la flag oculta en el sistema de archivos del servidor.',
        solves: 8,
        author: 'EclipSec',
        connection: {
            type: 'web',
            host: CTF_SERVER.host,
            port: 8011,
            ...railwayChallenge('web-011'),
        },
        flagFormat: 'EclipSec{...}',
        hints: [
            'La página dice: Usage: ?cmd=whoami',
            'Intenta ?cmd=cat /flag_web011.txt',
        ],
        active: true,
    },
];

export const sortedChallenges = [...challenges].sort(
    (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
);
