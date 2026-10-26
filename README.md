# VORDO — Sublimación, estampados y personalizados

Página web con catálogo, pedidos por WhatsApp, base de clientes y panel de administrador.

## Requisitos

- **Node.js 22.5 o superior** (recomendado: la versión LTS más nueva, desde https://nodejs.org).
  Para ver tu versión: `node -v`
- No usa librerías externas: la base de datos (SQLite) viene incluida en Node.

## Cómo ponerla en marcha

```bash
npm install
npm run dev
```

(`npm install` no descarga nada porque el proyecto no tiene dependencias, pero no hace daño correrlo.)

Después abrí:

- Página: http://localhost:3000
- Panel de administrador: http://localhost:3000/admin

Para producción usá `npm start`. Se puede cambiar el puerto con la variable `PORT` (ej. `PORT=8080 npm start`).

## Primer ingreso al panel

- Usuario: `admin`
- Contraseña: `admin`

La primera vez el sistema **obliga a cambiar el usuario y la contraseña** antes de dejarte usar el panel.
Después de ese cambio, `admin / admin` deja de funcionar.

## Qué se puede hacer desde el panel

| Sección | Para qué sirve |
|---|---|
| Resumen | Pedidos nuevos, pedidos del mes, clientes y productos activos, gráfico de los últimos 14 días. |
| Pedidos | Todos los pedidos de la página. Cambiar estado (Nuevo → En producción → Listo → Entregado / Cancelado), notas internas, ver la imagen de referencia, escribirle al cliente por WhatsApp, cargar pedidos a mano y exportar a Excel. |
| Clientes | Base de clientes (se crea sola con cada pedido; si el teléfono ya existe, el pedido se suma a ese cliente). Ficha con historial, notas y exportación a Excel. |
| Productos | Agregar, editar, ocultar, destacar y eliminar productos con varias fotos. Lo activo aparece en la página; lo destacado sale primero. |
| Categorías | Crear, editar, ordenar y eliminar categorías (Personalizado, Random, etc.). |
| Usuarios* | Crear varios usuarios con rol **Administrador** o **Empleado/Editor**. Cada usuario nuevo recibe una contraseña temporal y debe cambiarla al entrar. No se puede eliminar el último administrador. |
| Configuración* | Nombre, slogan, WhatsApp de pedidos, Instagram, Facebook, TikTok, dirección, Google Maps, horarios, email, textos de la portada, servicios, pasos de "Cómo pedir", prendas del formulario, logo, favicon, imagen de portada y activar/desactivar la intro. |
| Actividad* | Registro de quién creó, editó o eliminó cada cosa y cuándo. |
| Mi cuenta | Cambiar tu contraseña. |

\* Solo para administradores. Los empleados no ven estas secciones (y el servidor también lo bloquea).

## Pedidos por WhatsApp

Cada pedido (de un producto o personalizado) **se guarda primero en la base de datos** y después abre WhatsApp
con el mensaje armado hacia el número configurado (por defecto +54 9 11 3344-1685).
El botón verde flotante aparece en todas las páginas.

## La presentación y el logo animado

- Al entrar se ve la intro: el logo se dibuja y se arma, sale humo por los bordes y una plancha sublima una remera con el logo.
  Tiene botón "Saltar intro", se muestra una vez por visita y se puede apagar desde Configuración.
- Después el logo queda con brillo metálico, resplandor y brasas. Con el mouse se inclina en 3D, la luz sigue al cursor y salen chispas.
  En celulares usa el giroscopio (o una inclinación automática) y al tocarlo saltan chispas.
- Si la persona tiene activado "reducir movimiento" en su sistema, todo se muestra quieto.
- Si subís otro logo desde Configuración, la intro usa ese logo (con una animación de aparición más simple).
  Usalo en **PNG sin fondo** para que los efectos se vean bien.

## Dónde se guardan los datos

Todo queda en la carpeta `data/`:

- `data/vordo.db` → base de datos (productos, clientes, pedidos, usuarios, configuración).
- `data/uploads/` → fotos de productos y logos subidos. Las imágenes de referencia de los clientes van en `data/uploads/private/` y solo se ven desde el panel.

**Hacé copia de seguridad de la carpeta `data/`.** Si la borrás, se pierde todo.

Para empezar de cero (borra todo y vuelve a `admin / admin`): `npm run reset-db`

## Publicarla en internet

Sirve cualquier hosting que corra Node.js 22.5+ con disco persistente (VPS, Railway, Render con disco, etc.):

1. Subí el proyecto (sin la carpeta `data/` si querés empezar limpio).
2. Comando de inicio: `npm start`.
3. Asegurate de que la carpeta `data/` quede en un disco que no se borre en cada deploy (o configurá `VORDO_DATA_DIR` apuntando a ese disco).
4. Usá HTTPS (el hosting suele darlo). La cookie de sesión se marca como segura automáticamente.

## Seguridad incluida

- Contraseñas guardadas con hash (scrypt), nunca en texto plano.
- Sesiones con cookie HttpOnly y SameSite=Strict, que vencen a las 12 horas.
- Límite de intentos de inicio de sesión y de pedidos por conexión.
- Permisos por rol validados en el servidor.
- Protección contra envíos desde otros sitios (CSRF) y encabezados de seguridad (CSP).
- Las imágenes subidas se validan por contenido, no solo por extensión.

## Estructura

```
server.js            servidor web
lib/db.js            base de datos y datos iniciales
lib/api.js           rutas de la API (pública y del panel)
lib/auth.js          sesiones, primer ingreso, contraseñas
lib/orders.js        pedidos y clientes
lib/security.js      hash de contraseñas y límites
public/index.html    página pública
public/js/intro.js   presentación de entrada
public/js/logo-fx.js efectos del logo
public/js/site.js    catálogo, pedidos, WhatsApp
public/admin/        panel de administrador
public/brand/        logo, ícono, plancha
```
