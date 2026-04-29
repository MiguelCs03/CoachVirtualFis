# Flujo de Ejercicios

Este módulo contiene un flujo limpio y estructurado para la selección de ejercicios.

## Estructura del Flujo

### 1. CategoriaEjercicios (`/ejercicios/categoria`)
- **Descripción**: Vista inicial donde el usuario selecciona entre Gimnasio o Fisioterapia
- **Navegación**: Al seleccionar, redirige a `/ejercicios/parte-cuerpo?categoria=XXX`

### 2. ParteCuerpo (`/ejercicios/parte-cuerpo`)
- **Descripción**: Muestra las partes del cuerpo disponibles
- **Opciones**: Brazos, Piernas, Espalda, Cintura, Cabeza
- **Parámetro**: Recibe `categoria` por query string
- **Navegación**: Al seleccionar, redirige a `/ejercicios/seleccion?categoria=XXX&parte=YYY`

### 3. SeleccionEjercicio (`/ejercicios/seleccion`)
- **Descripción**: Muestra los ejercicios específicos disponibles para la parte del cuerpo
- **Ejemplos**: 
  - Brazos: Bíceps, Tríceps, Antebrazos
  - Piernas: Cuádriceps, Isquiotibiales
  - etc.
- **Parámetros**: Recibe `categoria` y `parte` por query string
- **Acción**: Al seleccionar un ejercicio, muestra un alert (preparado para navegar a la página de entrenamiento)

## Características de Diseño

- ✅ **Tailwind CSS**: Diseño responsivo y moderno
- ✅ **Navegación fluida**: Breadcrumbs y botones de retroceso
- ✅ **Efectos hover**: Transiciones suaves y feedback visual
- ✅ **Iconos lucide-react**: Interfaz intuitiva con iconografía clara
- ✅ **Gradientes**: Paleta de colores diferenciada por sección
- ✅ **Responsive**: Adaptado a móviles, tablets y desktop

## Datos de Ejemplo

Los datos de ejercicios están actualmente hardcodeados en `SeleccionEjercicio.jsx`.

Para conectar con API:
1. Crear servicio en `src/services/EjerciciosFlowService.js`
2. Implementar endpoints en el backend
3. Reemplazar el objeto `ejerciciosPorParte` con llamadas a API

## Próximos Pasos

- [ ] Conectar con API del backend
- [ ] Crear página de entrenamiento individual para cada ejercicio
- [ ] Añadir filtros (dificultad, duración)
- [ ] Implementar favoritos
- [ ] Añadir historial de ejercicios realizados
- [ ] Integrar con el sistema de seguimiento de progreso
