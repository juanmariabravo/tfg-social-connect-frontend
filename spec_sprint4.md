# Especificación Técnica: Sprint 4 - Frontend: Planes, Descubrimiento y Notificaciones
**Fechas:** 01/06/2026 - 14/06/2026
**Estado:** En Definición ⌚

---

## 0. Fase de Diseño (Mockups)
**Herramienta:** Figma / Lovable
**Objetivo:** Crear las vistas de alta fidelidad para conectarlas con la lógica del backend.

### 0.1 Mockups a Implementar
- [ ] **Home (Descubrimiento):** Swipe cards para conectar con nuevos usuarios.
- [ ] **Planes (Feed):** Listado interactivo con avatares de participantes y barra de reacciones.
- [ ] **Planes (Creación):** Formulario para lanzar propuestas rápidas.
- [ ] **Notificaciones:** Vista centralizada con indicadores de actividad reciente.
- [ ] **Perfil (Gestión):** Sección para listar/eliminar amigos y botón de Logout.

---

## 1. Alcance del Sprint
El objetivo es diseñar el prototipo estático y transformarlo en una aplicación funcional, integrando el sistema de planes, las notificaciones en tiempo real vía Sockets, el flujo de descubrimiento de usuarios y la gestión de sesión/amistades.

## 2. Requisitos Técnicos
- **Framework:** React 19 (TanStack Start / TS)
- **Estilos:** Tailwind CSS 4 + Radix UI.
- **WebSockets:** `socket.io-client` para notificaciones push.
- **Navegación:** TanStack Router.

## 3. Vistas y Componentes Clave

### 3.1 Inicio / Descubrimiento (`src/pages/Home.tsx`)
- **Funcionalidad:**
  - Carga de perfiles aleatorios (`GET /api/profiles/random`).
  - Acción "Conectar" (❤️): Llama a `POST /api/friends/request/:id`.
  - Acción "Descartar" (❌): Animación de salida y carga del siguiente perfil.
  - Soporte para fotos "Real" y "Virtual" con selector de tipo.

### 3.2 Planes - Feed y Creación (`src/pages/Plans.tsx`)
- **Funcionalidad:**
  - Carga de planes con `GET /api/plans`.
  - **Reacciones:** Actualización instantánea del contador al pulsar botón de reacciones y llamada a `POST /api/plans/:id/react`.
  - **Participación:** Al pulsar "Me apunto", añadir avatar dinámicamente y hacer la llamada a `POST /api/plans/:id/join`.
  - **Comentarios:** Hilo de discusión por plan. Al enviar un comentario, se actualiza el feed y se notifica al creador del plan. Se hace llamada a `POST /api/plans/:id/comments`.
  - **Formulario:** Modal/Sección de creación con validación de campos para la creación de planes con `POST /api/plans`.

### 3.3 Notificaciones (`src/pages/Notifications.tsx`)
- **Descripción**: Centro de avisos e indicador numérico en la navegación.
- **Funcionalidad:**
  - En `AppShell.tsx`: Consultar cantidad de notificaciones no leídas (`GET /api/notifications`).
  - En `Notifications`: Listar datos reales de la API. Marcar como leídas visualmente si `read === true`.
  - Redirección lógica al hacer click según el `type` de notificación. Si la notificación es de tipo "plan", el enlace debe llevar a `/plans`. Si es de "friend", a `/friends` o `/u/$id`.

### 3.4 Perfil y Gestión de Amigos (`src/pages/Profile.tsx`)
- **Descripción**: Visualización del listado de amigos del usuario y posibilidad de eliminar amistades.
- **Funcionalidad:**
  - Listado detallado de amistades existentes con la llamada a `GET /api/friends`.
  - Botón de **Eliminar Amigo** con diálogo de confirmación que llama a `DELETE /api/friends/:id`.
  - **Cierre de Sesión:** Botón de Logout en `AppShell` que limpia el `localStorage` y redirige a `/`.

## 4. Integración Síncrona (WebSockets)
- **Tecnología:** Context API `SocketContext.tsx`.
- **Eventos a Escuchar:**
  - `new_notification`: Actualiza el contador de notificaciones en tiempo real.
  - `plan_join` / `plan_comment`: Notifica si hay actividad en planes creados por el usuario.

## 5. Definición de Hecho (Definition of Done)
- [ ] Vistas creadas y conectadas con los endpoints del backend.
- [ ] Lógica de swipe en el Home operativa con llamadas al backend.
- [ ] Feed de planes con soporte para reacciones y comentarios funcionales.
- [ ] Centro de notificaciones reactivo a eventos de Socket.io.
- [ ] Botón de cierre de sesión implementado y verificado.
- [ ] UI adaptada (Responsive check) para móvil y escritorio.
- [ ] Código verificado y mergeado en `main`.

*La documentación refleja siempre la realidad del código.*