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
    host: 'academiahackingucncqbo-production.up.railway.app',
    webBaseUrl: 'http://academiahackingucncqbo-production.up.railway.app',
} as const;

export const DIFFICULTY_ORDER: Record<Difficulty, number> = {
    EASY: 0, MEDIUM: 1, HARD: 2, INSANE: 3,
};

/* ─────────────────────────────────────────────────────────────────
 * Lista de retos
 *
 * Cada reto corresponde a un servicio en docker-compose.yml
 * Puerto web:  800X  (docker: -p 800X:80)
 * Puerto ttyd: 768X  (docker: -p 768X:7681)
 *
 * En producción Railway, cada reto tiene su propia URL.
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
            wsPort: 7681,
            url: CTF_SERVER.railwayUrl,
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{h1dd3n_1n_pl41n_s1ght}',
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
            wsPort: 7682,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{r0b0ts_4r3_y0ur_fr13nd5}',
        hints: ['¿Conoces el archivo robots.txt?', 'Visita las rutas que están "prohibidas".'],
        active: false,
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
            wsPort: 7683,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{c00k13_m0nst3r_m4n1pul4t10n}',
        hints: ['Inspecciona las cookies del sitio con DevTools.', 'Cambia el valor de la cookie "role" a algo más poderoso.'],
        active: false,
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
            wsPort: 7689,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{b4ckup_f1l3s_4r3_l34ks}',
        hints: ['¿Qué extensiones usan los archivos de respaldo?', 'Prueba con index.py.bak'],
        active: false,
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
            wsPort: 7684,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        hints: ['Intenta encadenar comandos con ; o |', 'Busca archivos interesantes con cat /flag.txt'],
        active: false,
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
            wsPort: 7685,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{l0c4l_f1l3_1nclus10n_m4st3r}',
        hints: ['Observa el parámetro ?file= en la URL.', 'Intenta leer /flag.txt o /etc/passwd usando path traversal.'],
        active: false,
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
            wsPort: 7686,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{sql1_byp4ss_l0g1n}',
        hints: ['Piensa en cómo romper una consulta SQL con comillas simples.', "Clásico: ' OR '1'='1' --"],
        active: false,
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
            wsPort: 7687,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{1d0r_c4n_b3_d4ng3r0us}',
        hints: ['Observa el parámetro ?id= en la URL.', '¿Qué pasa si cambias el ID a 0?'],
        active: false,
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
            wsPort: 7690,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{h34d3rs_c4n_b3_sp00f3d}',
        hints: [
            'Necesitas modificar dos cabeceras HTTP.',
            'User-Agent: SecureBrowser1.0 y X-Forwarded-For: 127.0.0.1',
        ],
        active: false,
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
            wsPort: 7688,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{sst1_t3mpl4t3_1nj3ct10n}',
        hints: [
            'Prueba con {{7*7}} en el parámetro name.',
            'Busca clases de Python para acceder a os y leer variables de entorno.',
        ],
        active: false,
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
            wsPort: 7691,
            url: '', // TODO: Agregar URL de Railway
        },
        flagFormat: 'EclipSec{...}',
        flag: 'EclipSec{c0mm4nd_3x3cut10n_v1a_g3t}',
        hints: [
            'La página dice: Usage: ?cmd=whoami',
            'Intenta ?cmd=cat /flag.txt',
        ],
        active: false,
    },
];

export const sortedChallenges = [...challenges].sort(
    (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
);
