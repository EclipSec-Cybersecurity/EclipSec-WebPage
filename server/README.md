# EclipSec CTF Backend (Railway Deployment)

Este backend contiene la API de autenticación, control de participantes, ranking y validación de flags de **CTF Academy**.

---

## 🚀 Despliegue en Railway

### 1. Crear un proyecto en Railway
1. Ve a [Railway Dashboard](https://railway.app/).
2. Haz clic en **New Project** → **Deploy from GitHub repo** (o despliega esta carpeta `server/`).
3. Añade una base de datos **Redis** en el mismo proyecto (**New** → **Database** → **Add Redis**).

### 2. Variables de Entorno en Railway
Configura las siguientes variables de entorno en el servicio del backend en Railway:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `PORT` | Puerto HTTP (Railway lo inyecta automáticamente) | `3000` |
| `REDIS_URL` | URL de conexión de Redis (Railway la inyecta si conectas el Redis del proyecto) | `${{Redis.REDIS_URL}}` |
| `ALLOWED_ORIGINS` | Dominios permitidos por CORS separados por comas | `https://eclipsec.cl,https://tu-proyecto.vercel.app` |
| `CTF_ADMIN_USER` | Usuario del administrador (opcional) | `admin` |
| `CTF_ADMIN_PASSWORD` | Contraseña del administrador | `TuPasswordSeguro2026!` |

---

## 🔗 Conexión con Frontend (Vercel)

En tu panel de proyecto en **Vercel** (Settings → Environment Variables):

1. Agrega la variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tu-backend-produccion.up.railway.app` (sin barra final)
2. Si tienes los laboratorios de retos / Docker en Railway:
   - **Key**: `VITE_CTF_RAILWAY_DOMAIN`
   - **Value**: `https://academiahackingucncqbo-production.up.railway.app`
3. Redespliega el frontend en Vercel.

---

## 💻 Ejecución Local

```bash
cd server
npm install
REDIS_URL="redis://localhost:6379" npm start
```
