# Especificación Técnica: Sprint 3 - Frontend: Mensajería y Navegación
**Fechas:** 18/05/2026 - 31/05/2026
**Objetivo:** Implementar la interfaz del chat (individual y grupal), la lista de conversaciones, notificaciones síncronas y la barra de navegación principal.

---

## 0. Fase de Diseño (Mockups)
**Herramienta:** Figma / Lovable
**Objetivo:** Diseñar la experiencia de usuario para la comunicación y navegación.

### 0.1 Mockups a crear
- [ ] **Navbar:** Barra de navegación global (adaptada a Mobile/Desktop). Aparecerán las secciones Inicio, Explorar, Planes, Chats, Perfil. Incluir indicador visual de notificaciones en el icono de chat.
- [ ] **Chat (Listado):** Vista de conversaciones activas con último mensaje y estado de lectura.
- [ ] **Chat (Ventana):** Burbujas de chat, input de texto que permite enviar con Enter, scroll automático al recibir mensaje y carga de mensajes antiguos al hacer scroll hacia arriba. Permite botón de adjuntar foto (opcional) y de visualizador de emojis.
- [ ] **Nuevo Chat:** Modal o vista para crear chat seleccionando múltiples amigos.

### 0.2 Entregables
- [ ] Enlaces a prototipos / Capturas en la carpeta `/Mockups`.

---

## 1. Alcance del Sprint
Construir la estructura global de navegación (Navbar), desarrollar todo el sistema de UI para la mensajería y establecer la conexión por WebSockets para manejar notificaciones y mensajes en tiempo real.

## 2. Requisitos Técnicos
- **Framework:** React 19 (TypeScript)
- **Estilos:** Tailwind CSS 4 + Componentes UI (Radix/shadcn).
- **WebSockets:** `socket.io-client`.
- **Gestión de Estado Síncrono:** Context API (`SocketContext.tsx`).
- **Enrutamiento:** React Router 7.

## 3. Vistas y Componentes a Implementar

### 3.1 Navbar (Navegación Global)
- **Funcionalidad:** Permitir el movimiento entre las secciones clave de la app (Inicio, Explorar, Planes, Chats, Perfil).
- **Notificaciones Síncronas:** Implementar alertas visuales (puntito rojo en el icono de chat o número) que se actualicen en tiempo real al recibir un evento síncrono.

### 3.2 Chat - Listado (/chats)
- **Funcionalidad:**
  - Consumir el endpoint GET `/api/chats`.
  - Renderizar la lista de conversaciones con el nombre, último mensaje y estado.
  - Incluir botón de acción flotante (FAB) o similar para "Nuevo Chat".

### 3.3 Chat - Nuevo (Modal o Vista)
- **Funcionalidad:**
  - Consumir la lista de amigos (GET `/api/friends`).
  - Permitir selección múltiple para crear un chat de grupo, o individual.
  - Llamar a POST `/api/chats` y redirigir a la ventana del nuevo chat.

### 3.4 Chat - Ventana de Conversación (/chats/:chatId)
- **Funcionalidad:**
  - Diseño de burbujas (derecha para enviados, izquierda para recibidos).
  - **Scroll:** Scroll automático hacia el último mensaje al entrar y al recibir un mensaje nuevo.
  - **Historial:** Recargar mensajes más antiguos al hacer scroll hacia arriba (integración con GET `/api/chats/:chatId/messages`).
  - Enviar mensaje al pulsar la tecla `Enter`.

## 4. Integración Síncrona (WebSockets)
- **Lógica de Conexión:** Crear un `SocketProvider` que inicialice la conexión a Socket.io únicamente cuando el usuario esté autenticado (pasando el JWT).
- **Manejo de Eventos:**
  - Escuchar evento `new_message` para agregar el mensaje dinámicamente a la ventana de chat si está abierta, o actualizar el contador/último mensaje en la lista de chats/navbar.
  - Preparar infraestructura (listeners) para solictudes de amistad.

## 5. Estructura de Componentes
- `/src/components/layout/Navbar.tsx` (Componente persistente de diseño principal).
- `/src/pages/Chats.tsx` (Listado de conversaciones y vista de cada chat).
- `/src/components/chat/NewChatModal.tsx` (Creación de grupos/individuales).
- `/src/context/SocketContext.tsx` (Gestor de la conexión en tiempo real).

## 6. Estrategia de Pruebas (Visual y Funcional)
- **Workflow:**
  1. Validar que la Navbar se muestra en todas las rutas protegidas y navega correctamente.
  2. Crear un chat con un usuario de prueba y comprobar que se renderiza la lista.
  3. Probar el envío de un mensaje pulsando "Enter" y verificar la aparición inmediata de la burbuja.
  4. Testing cruzado (dos pestañas simulando dos usuarios): verificar que el receptor recibe el mensaje por WebSocket, hace auto-scroll y el indicador del Navbar se enciende.
  5. Comprobar la carga de mensajes antiguos al hacer scroll up.

## 7. Definición de Hecho (Definition of Done)
### Fase Diseño
- [ ] Wireframes/Mockups validados y documentados.

### Fase Implementación
- [ ] Navbar funcional con indicador de notificaciones reactivo a WebSockets.
- [ ] Listado de chats conectado al backend.
- [ ] Modal de nuevo chat soporta selección múltiple de amigos.
- [ ] Ventana de chat operativa (burbujas, envío con Enter, auto-scroll).
- [ ] Conexión de `socket.io-client` implementada globalmente mediante Context, autenticada con JWT.
- [ ] Mensajes en tiempo real comprobados y funcionando entre clientes.
- [ ] Código subido a la rama `feature/` y mergeado a `main`.

*La documentación refleja siempre la realidad del código.*