# Documentación del Frontend

Este archivo describe la estructura, convenciones y pasos básicos para trabajar con el frontend de
`coachvirtualfront` (React + Vite + Tailwind). Está pensado como guía rápida para desarrolladores
nuevos en el proyecto.

---

## Resumen rápido
- Framework: React (con Vite)
- Estilos: Tailwind CSS
- Peticiones HTTP: `axios` (archivo central: `src/api/api.js`)
- Rutas: `react-router-dom` (configuradas en `src/routes/AppRoutes.jsx`)

---

## Estructura principal (carpeta `src/`)

- `api/` : helpers para llamadas HTTP (ya incluido `src/api/api.js`). Aquí se centraliza la configuración
	de `axios` y el manejo de tokens (refresh automático).
- `auth/`: Provider y hooks para autenticación (`AuthProvider.jsx`, `useAuth.js`). Maneja estado global
	de sesión y permisos.
- `components/`: componentes reutilizables (Sidebar, Header, botones, etc.). Crea componentes pequeños y
	componerlos en vistas más grandes.
- `pages/`: vistas principales de la app (cada ruta suele mapear a un componente en `pages/`).
- `routes/`: definición de rutas y guards (`AppRoutes.jsx`, `CategoryGate.jsx`).
- `services/`: integraciones externas, utilidades para consumir APIs de terceros (IA, cloudinary, etc.).
- `utils/`: funciones utilitarias compartidas (por ejemplo `poseUtils.js`).
- `assets/`: recursos empaquetados por el bundler (imágenes, íconos si se desea importarlas desde `src`).
- `public/`: recursos estáticos accesibles directamente (ej. `public/images/...`).

---

## Scripts útiles (desde `coachvirtualfront`)

```powershell
# instalar dependencias
npm install

# levantar servidor de desarrollo (Vite)
npm run dev


Puerto por defecto: Vite suele usar `5173` (ver salida de `npm run dev`).

---

## Variables de entorno

- `VITE_API_BASE_URL`: URL base para las API del backend. Ejemplo: `VITE_API_BASE_URL=http://127.0.0.1:8000/api`

Coloca las variables en un `.env` en la raíz del proyecto `coachvirtualfront/` (Vite usa prefijo `VITE_`).

---

## Cómo llamar a la API

Se recomienda usar el helper central `src/api/api.js` que ya implementa:
- Base URL configurable con `VITE_API_BASE_URL`.
- Interceptors para añadir `Authorization: Bearer <token>` automáticamente.
- Refresh de token cuando el `access` expira y reintento de la petición.

Ejemplo rápido de uso en un componente:

```javascript
import api from '../api/api';

// GET /rutinas/
const { data } = await api.get('/rutinas/');

// POST /rutinas/
await api.post('/rutinas/', { nombre: 'Mi rutina', ejercicios: [] });
```

---

## Añadir una nueva página / flujo

Recomendación mínima para mantener consistencia:

1. Crear el archivo en `src/pages/NombrePagina/NombrePagina.jsx`.
2. Crear un CSS o usar utilidades Tailwind (preferible usar Tailwind).
3. Registrar la ruta en `src/routes/AppRoutes.jsx`.
4. Añadir una entrada de navegación si corresponde (ej: en `src/components/Sidebar.jsx`).

Ejemplo de ruta:

```jsx
import MiPagina from '../pages/MiPagina/MiPagina';
// ...
<Route path="/mi-pagina" element={<MiPagina />} />
```

---

## Patrones y convenciones

- Usa funciones puras y hooks para lógica (mantén los componentes presentacionales lo más puros posible).
- Nombra componentes con PascalCase: `MiComponente.jsx`.
- Mantén las rutas en `src/routes` y evita lógica de routing en componentes individuales.
- Usa `src/services` para lógica que consulte APIs externas (IA, Cloudinary, etc.).
- Coloca imágenes estáticas que no necesiten processing en `public/images/` y refs directas: `/images/mi.jpg`.
- Si quieres versionar o importar imágenes en el bundle, ponlas en `src/assets/` y usa `import img from '../assets/mi.jpg'`.

---

## Estilos (Tailwind)

- Tailwind ya está configurado (ver `tailwind.config.js`). Usa utilidades en clase HTML.
- Para animaciones o utilidades personalizadas, añade reglas en `src/index.css`.

Ejemplo de uso:

```jsx
<div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
	Hola mundo
</div>
```

---

## Assets y dónde colocar imágenes

- Rutas públicas (más simples): `public/images/` (ej: `public/images/triceps/start.jpg`).
- Imports en bundle: `src/assets/images/` y `import start from '../assets/images/triceps/start.jpg'`.

Recomendación práctica: use `public/images/` para imágenes de referencia y `src/assets/` para imágenes que se importarán en componentes.

---

## Testing y linting

- Linter: `npm run lint` (ESLint configurado).
- Añadir tests unitarios si se necesita (no hay framework de tests por defecto configurado).

---

## Buenas prácticas para integración con backend

- Centralizar URL en `VITE_API_BASE_URL`.
- Manejar errores y mostrar mensajes de usuario (toasts/snackbars).
- Minimizar lógica asíncrona en componentes; usa hooks o servicios.
- Validar esquemas (inputs) antes de enviar al backend.

---

## Despliegue (build)

1. Ejecutar `npm run build` para generar `dist/`.
2. Servir los archivos estáticos (`dist`) en un servidor estático (Netlify, Vercel, GitHub Pages o un servidor nginx).

Si usas un hosting que soporta rewrites (SPA), asegúrate de redirigir todas las rutas a `index.html`.

---

## Recursos y dependencias principales

- React, React Router, Tailwind CSS, Vite, Axios, lucide-react
- Modelos de pose / IA (opcional): `@mediapipe/pose`, `@mediapipe/tasks-vision`, `@tensorflow/tfjs` (si usas TFJS)

---

## Cómo contribuir rápido (checklist)

1. Fork / branch feature/mi-feature
2. Instalar deps: `npm install`
3. Levantar dev: `npm run dev`
4. Crear componente/página en `src/pages`
5. Registrar ruta en `src/routes/AppRoutes.jsx`
6. Probar en navegador, corregir lints
7. PR con descripción y screenshots

---

Si quieres, puedo:

- Añadir un ejemplo de componente y su test.
- Crear una plantilla para nuevas páginas (boilerplate generator).
- Integrar `eslint --fix` y pre-commit hooks.

Dime cuál de estas tareas quieres que haga a continuación y la implemento.