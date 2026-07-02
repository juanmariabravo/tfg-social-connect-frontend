# Social Connect - Frontend

Este es el repositorio del cliente frontend para el proyecto "Social Connect", una aplicación web para la conexión social basada en intereses compartidos y personalidad, desarrollado como parte de mi Trabajo de Fin de Grado (TFG).

La interfaz de usuario está construida como una SPA moderna utilizando **React**, **TypeScript**, **Vite**, **Tailwind CSS v4** y **Shadcn UI**, optimizada para ofrecer una navegación fluida, diseño responsivo y alta fidelidad visual.

## Características

- **Diseño Moderno y Limpio:** Maquetación moderna utilizando Tailwind CSS v4 y componentes Shadcn UI.
- **Navegación Dinámica:** Enrutado de cliente fluido mediante React Router Dom.
- **Comunicación en Tiempo Real:** Integración con WebSockets a través de Socket.io-client para chat instantáneo y notificaciones.
- **Tipado Estricto:** Código robusto y autocompletado nativo gracias a TypeScript.
- **E2E Testing:** Suite completa de pruebas de extremo a extremo utilizando Playwright.

## Empezando

Sigue estos pasos para levantar el entorno de desarrollo local.

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- El servidor backend de Social Connect debe estar levantado (por defecto en `http://localhost:5000`).

### Instalación

1.  Clona el repositorio:
    ```sh
    git clone https://github.com/juanmariabravo/tfg-social-connect-frontend.git
    cd tfg-social-connect-frontend
    ```

2.  Instala las dependencias del proyecto:
    ```sh
    npm install
    ```

3.  Configura las variables de entorno:
    Crea un archivo `.env` en la raíz del proyecto. Puedes duplicar el archivo de ejemplo:
    ```sh
    # Windows (cmd):
    copy .env.example .env
    # Linux/macOS:
    cp .env.example .env
    ```
    Asegúrate de que la variable `VITE_API_URL` apunta a la URL de tu backend activo (por defecto `http://localhost:5000`).

## Scripts Disponibles

Encontrarás los siguientes scripts en el archivo `package.json` para gestionar el proyecto:

-   **`npm run dev`**
    Inicia el servidor de desarrollo de Vite con recarga rápida (HMR). Abre `http://localhost:5173` en tu navegador.

-   **`npm run build`**
    Compila y optimiza la aplicación para su despliegue en producción en la carpeta `dist/`.

-   **`npm run preview`**
    Previsualiza localmente la compilación de producción generada por el comando anterior.

-   **`npm run lint`**
    Analiza el código con `ESLint` para asegurar las directrices de estilo y calidad de código.

-   **`npm run lint:fix`**
    Corrige automáticamente los problemas de estilo con `ESLint` y formatea todo el proyecto con `Prettier`.

-   **`npm run format`**
    Aplica el formateo estricto de código con `Prettier`.

### Pruebas de Extremo a Extremo (E2E)

La aplicación utiliza **Playwright** para validar los flujos críticos de la interfaz:

-   **`npm run test:e2e`**
    Ejecuta toda la suite de pruebas E2E en paralelo sobre múltiples navegadores.

-   **`npm run test:e2e:serial`**
    Ejecuta las pruebas en modo secuencial en el navegador Chromium (ideal para entornos con limitaciones de concurrencia).

#### Ejecutar las pruebas con UI interactiva

Si quieres inspeccionar y lanzar los tests desde la interfaz visual de Playwright, usa este comando:

```sh
npx playwright test --ui
```

Esto abre el panel de Playwright Test UI, desde el que puedes:

-   Filtrar pruebas por archivo, nombre o estado.
-   Ejecutar tests de forma individual o por bloques.
-   Ver trazas, capturas y el estado de cada paso.
-   Repetir rápidamente una prueba mientras depuras la interfaz.

Necesitas tener el frontend preparado y, si el flujo depende del backend, también el servidor backend levantado antes de abrir la UI.

## Estructura de Carpetas Principal

-   `src/components/` - Componentes reutilizables de UI (botones, tarjetas, modales, etc.) y layouts compartidos.
-   `src/routes/` - Vistas y pantallas principales mapeadas por rutas.
-   `src/hooks/` - Hooks personalizados de React (gestión de estado de auth, sockets, etc.).
-   `src/lib/` - Configuración de utilidades (instancia de Axios configurada, utilidades de clases, etc.).
-   `tests/` - Especificaciones y archivos de prueba E2E de Playwright.
