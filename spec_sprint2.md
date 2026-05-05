# Especificación Técnica: Sprint 2 - Frontend: Usuarios y Perfiles
**Fechas:** 04/05/2026 - 18/05/2026
**Objetivo:** Implementar la interfaz de usuario para autenticación y gestión de perfiles.

---

## 0. Fase de Diseño (Mockups)
**Herramienta:** Figma / Lovable
**Objetivo:** Crear wireframes y mockups antes de implementar

### 0.1 Mockups a crear
- [ ] Login (/login) - Wireframe mobile + desktop
- [ ] Registro (/register) - Wireframe mobile + desktop
- [ ] Perfil (/profile) - Wireframe mobile + desktop
- [ ] Editar Perfil (/profile/edit) - Wireframe mobile + desktop
- [ ] Onboarding (/onboarding) - Wireframe de los pasos 1-4

### 0.2 Entregables
- [ ] Links a prototipos en Figma/Lovable
- [ ] Capturas para documentación
- [ ] Checklist de componentes por vista

---

## 1. Alcance del Sprint
El objetivo principal es implementar las vistas de login, registro y perfil de usuario, conectándolas con los endpoints del backend del Sprint 2.

## 2. Requisitos Técnicos
- **Framework:** React.js
- **Gestión de estado:** Context API o Zustand
- **Cliente HTTP:** Axios
- **Enrutamiento:** React Router
- **Autenticación:** Almacenar JWT en localStorage

## 3. Vistas a implementar

### 3.1 Login (/login)
- **Campos:** email, contraseña
- **Funcionalidad:**
  - Enviar credenciales a POST /api/auth/login
  - Almacenar JWT en localStorage
  - Redireccionar a /profile tras login exitoso
- **Estados:** idle, loading, error

### 3.2 Registro (/register)
- **Campos:** username, email, contraseña, confirmar contraseña
- **Funcionalidad:**
  - Enviar datos a POST /api/auth/register
  - Almacenar JWT en localStorage
  - Redireccionar a /profile tras registro exitoso
- **Estados:** idle, loading, error

### 3.3 Perfil (/profile)
- **Funcionalidad:**
  - Obtener datos del perfil con GET /api/profiles/:userId
  - Mostrar datos: displayName, bio, avatar, intereses
  - Mostrar atributos de personalidad (gráfico o lista)
- **Estados:** loading, loaded, error

### 3.4 Editar Perfil (/profile/edit)
- **Campos:** displayName, bio, avatar (URL), intereses (tags), personalidad (sliders 1-10)
- **Funcionalidad:**
  - Enviar datos modificados a PUT /api/profiles/:userId
  - Validar campos antes de enviar
- **Estados:** idle, loading, success, error

### 3.5 Encuesta de Personalidad e Intereses (/onboarding)
- **Descripción:** Encuesta dinámica inicial para configurar el perfil tras el primer login.
- **Trigger:** Se muestra cuando el usuario no tiene perfil creado o está vacío.
- **Flujo:**
  1. Pantalla de bienvenida + explicar propósito.
  2. Paso 1: Elegir intereses (tags predefinidos + personalizados).
  3. Paso 2: Contestar preguntas de personalidad (5-10 preguntas scale 1-5).
  4. Paso 3: Revisar y guardar.
- **Funcionalidad:**
  - Guardar en PUT /api/profiles/:userId tras completarse.
  - Marcar perfil como "configurado" para no mostrar de nuevo.
- **Estados:** idle, loading, saving, success, error

## 4. Estructura de componentes
- `/src/pages/Login.jsx`
- `/src/pages/Register.jsx`
- `/src/pages/Profile.jsx`
- `/src/pages/EditProfile.jsx`
- `/src/pages/Onboarding.jsx` (Encuesta de personalidad e intereses)
- `/src/components/Navbar.jsx` (Actualizar con menú de usuario logueado)
- `/src/context/AuthContext.jsx` (Gestión de estado de autenticación)

## 5. Servicios API
- `/src/services/api.js`: Configuración de Axios con interceptor para incluir JWT

## 6. Estrategia de Pruebas (Visual/Funcional)
- **Workflow:**
  1. Verificar que el formulario de login/envía datos correctamente.
  2. Verificar que el login redirige al perfil tras éxito.
  3. Verificar que el perfil muestra los datos del backend.
  4. Verificar que la edición de perfil guarda los cambios.

## 7. Definición de Hecho (Definition of Done)
### Fase Diseño
- [ ] Los mockups de todas las vistas están creados en Figma/Lovable.
- [ ] Se han validado los wireframes antes de implementar.

### Fase Implementación
- [ ] La vista de Login está operativa y conecta con el backend.
- [ ] La vista de Registro está operativa y conecta con el backend.
- [ ] La vista de Perfil muestra los datos correctamente.
- [ ] La edición de perfil funciona.
- [ ] El token JWT se gestiona correctamente (login/logout).
- [ ] El código está subido a la rama `feature/` y mergeado a `main`.

*La documentación refleja siempre la realidad del código.*