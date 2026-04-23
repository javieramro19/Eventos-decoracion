# Event Decor Landing Manager - Arquitectura

## 1. Descripción del Producto
Es una plataforma de gestión diseñada para empresas de decoración de eventos que necesitan crear micro-sitios específicos para cada proyecto. Permite mostrar galerías de fotos, gestionar bloques de contenido personalizados y recibir solicitudes de reserva de clientes. Incluye un panel administrativo para controlar toda la información de forma centralizada.

## 2. Stack Tecnológico
- **Frontend:** Angular 17 (Standalone Components, Signals, RxJS).
- **Backend:** Node.js 20 + Express.
- **Base de Datos:** MySQL 8 (Relacional).
- **Seguridad:** JWT (JSON Web Tokens) y bcrypt para el panel admin.
- **Gestión de Archivos:** Multer para la subida de fotos de decoración.

## 3. Funcionalidades Principales MVP
1. **Gestión de Eventos:** CRUD completo para crear y editar eventos (nombre, fecha, lugar).
2. **Constructor de Bloques:** Sistema para añadir secciones de texto o fotos a cada landing.
3. **Galería Dinámica:** Visualización y gestión de imágenes de alta calidad por evento.
4. **Sistema de Reservas:** Formulario de contacto que guarda los leads en la base de datos.
5. **Panel de Control:** Interfaz administrativa protegida para gestionar todo el contenido.

## 4. Esquema de Base de Datos
- **events:** (id, userId, name, date, location, description, status, coverImage)
- **sections:** (id, eventId, type, content, order)
- **gallery:** (id, eventId, imageUrl, caption, order)
- **contacts:** (id, eventId, name, email, phone, message, status, createdAt)