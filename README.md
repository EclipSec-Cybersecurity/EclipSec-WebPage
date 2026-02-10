# EclipSec | Ciberseguridad Ofensiva

Plataforma web corporativa para **EclipSec E.I.R.L.**, especializada en Ethical Hacking, Red Teaming y Cumplimiento Normativo.

## 🚀 Tecnologías

Este proyecto está construido con un stack moderno y seguro:

-   **Core**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
-   **Build System**: [Vite](https://vitejs.dev/)
-   **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Animaciones**: [Framer Motion](https://www.framer.com/motion/)
-   **Internacionalización**: [i18next](https://www.i18next.com/)
-   **Formularios**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
-   **Iconos**: [Lucide React](https://lucide.dev/)

## 🛠️ Instalación y Ejecución

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/ElRetrillo/ElRetrillo.github.io.git
    cd ElRetrillo.github.io
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Iniciar servidor de desarrollo**:
    ```bash
    npm run dev
    ```

4.  **Compilar para producción**:
    ```bash
    npm run build
    ```

## 🔐 Seguridad y Calidad (DevSecOps)

-   **Linting Estricto**: ESLint + Prettier configurados para Clean Code.
-   **Content Security Policy (CSP)**: Cabeceras estrictas implementadas en `index.html`.
-   **Sanitización**: Preveción de XSS mediante escape automático de React y validación de formularios con Zod.
-   **CI/CD**: GitHub Actions configurado para despliegue automático en GitHub Pages.

## 📁 Estructura del Proyecto

```
/src
  /components
    /layout       # Navbar, Footer
    /ui           # Componentes reutilizables (Cards, Buttons)
  /pages          # Vistas principales (Home, Services, About, Contact)
  /locales        # Archivos de traducción (es.json, en.json)
  /hooks          # Custom hooks
```
