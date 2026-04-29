# 🧘 Módulo de Yoga - Coach Virtual

## Descripción

Módulo completo de entrenamiento de posturas de yoga con detección de poses en tiempo real usando MediaPipe. Sistema de validación de ángulos corporales y feedback inmediato al usuario.

## Estructura de Archivos

```
src/pages/Yoga/
├── YogaPage.jsx         # Componente principal con selector de posturas
├── Tadasana.jsx         # Postura de la Montaña
├── Trikonasana.jsx      # Postura del Triángulo
├── Virabhadrasana.jsx   # Postura del Guerrero
└── README.md            # Este archivo
```

## Posturas Implementadas

### 1. Tadasana (Postura de la Montaña) 🧘‍♀️

**Objetivo:** Mantener una postura erguida con brazos extendidos hacia arriba.

**Ángulos validados:**

- Brazo izquierdo: 160-200°
- Brazo derecho: 160-200°
- Hombro izquierdo: 170-190°
- Hombro derecho: 170-190°
- Cintura izquierda: 170-190°
- Cintura derecha: 170-190°

**Landmarks utilizados:**

```javascript
// Brazos
11 (hombro izq) - 13 (codo izq) - 15 (muñeca izq)
12 (hombro der) - 14 (codo der) - 16 (muñeca der)

// Hombros
13 (codo izq) - 11 (hombro izq) - 23 (cadera izq)
14 (codo der) - 12 (hombro der) - 24 (cadera der)

// Cintura
12 (hombro der) - 24 (cadera der) - 28 (tobillo der)
11 (hombro izq) - 23 (cadera izq) - 27 (tobillo izq)
```

---

### 2. Trikonasana (Postura del Triángulo) 🔺

**Objetivo:** Inclinación lateral formando un triángulo con el cuerpo.

**Ángulos validados:**

- Brazo izquierdo: 165-195°
- Brazo derecho: 165-195°
- Espalda: 110-150°

**Landmarks utilizados:**

```javascript
// Brazos (completamente extendidos)
11 (hombro izq) - 13 (codo izq) - 15 (muñeca izq)
12 (hombro der) - 14 (codo der) - 16 (muñeca der)

// Inclinación de espalda
12 (hombro der) - 24 (cadera der) - 26 (rodilla der)
```

---

### 3. Virabhadrasana (Postura del Guerrero) ⚔️

**Objetivo:** Posición de estocada con brazos extendidos.

**Ángulos validados:**

- Brazo izquierdo: 170-190°
- Brazo derecho: 170-190°
- Pierna izquierda (doblada): 110-130°
- Pierna derecha (recta): 170-190°

**Landmarks utilizados:**

```javascript
// Brazos
11 (hombro izq) - 13 (codo izq) - 15 (muñeca izq)
12 (hombro der) - 14 (codo der) - 16 (muñeca der)

// Piernas
23 (cadera izq) - 25 (rodilla izq) - 27 (tobillo izq)
24 (cadera der) - 26 (rodilla der) - 28 (tobillo der)
```

---

## Características Técnicas

### Validación de Poses

Cada componente implementa:

1. **Detección continua** vía `PoseDetector`
2. **Cálculo de ángulos** usando `calculateAngle()` de `poseUtils.js`
3. **Validación de rangos** para cada articulación
4. **Sistema de timer** que solo cuenta cuando TODOS los ángulos son correctos
5. **Feedback visual** con colores (verde = correcto, rojo = incorrecto)
6. **Feedback auditivo** con síntesis de voz en español

### Flujo de Validación

```
Landmarks detectados
    ↓
Calcular 3-6 ángulos corporales
    ↓
Validar si están en rango
    ↓
¿Todos correctos?
    ├─ SÍ → Iniciar/continuar timer
    └─ NO → Resetear timer y mostrar feedback
    ↓
¿Timer alcanzó objetivo?
    └─ SÍ → Completado ✅ + Audio
```

### Estados del Componente

```javascript
const [secondsHeld, setSecondsHeld] = useState(0);     // Tiempo mantenido
const [isCorrectPose, setIsCorrectPose] = useState(false); // Postura correcta
const [feedback, setFeedback] = useState('...');       // Mensaje al usuario
const [completed, setCompleted] = useState(false);     // Objetivo alcanzado
const [angles, setAngles] = useState({...});           // Ángulos actuales
```

## Opciones Configurables

### Tiempo Objetivo

El usuario puede seleccionar:

- 10 segundos
- 20 segundos
- 30 segundos
- 60 segundos

### Cómo Funciona el Timer

```javascript
// Solo cuenta si TODAS las validaciones pasan
if (allCorrect) {
  if (!startTimeRef.current) {
    startTimeRef.current = now // Inicia
  }
  const elapsed = Math.floor((now - startTimeRef.current) / 1000)
  setSecondsHeld(elapsed)
} else {
  startTimeRef.current = null // Reset
  setSecondsHeld(0)
}
```

## Dependencias

- `PoseDetector`: Componente de detección MediaPipe
- `calculateAngle`: Función de cálculo de ángulos (trigonométrica)
- `useSpeech`: Hook para síntesis de voz
- `react-router-dom`: Navegación
- `tailwindcss`: Estilos

## Uso

```javascript
// Acceder desde el menú principal
;<Link to="/yoga">Yoga</Link>

// O directamente a una postura específica
import Tadasana from './pages/Yoga/Tadasana'
;<Tadasana timer={30} />
```

## Rutas

```javascript
// Ruta principal (selector)
/yoga → YogaPage.jsx

// La página maneja internamente las 3 posturas
// No hay rutas separadas para cada una
```

## Mejoras Futuras

- [ ] Agregar más posturas (Savasana, Vrikshasana, etc.)
- [ ] Sistema de progresión y niveles
- [ ] Guardado de estadísticas por usuario
- [ ] Modo espejo para facilitar imitación
- [ ] Comparación con pose de referencia en tiempo real
- [ ] Exportar sesión a PDF/imagen

## Diferencias con src2

| Aspecto   | src2 (Legacy)         | src (Moderno)           |
| --------- | --------------------- | ----------------------- |
| MediaPipe | @mediapipe/pose       | @mediapipe/tasks-vision |
| React     | Refs + useEffect      | Hooks modernos          |
| Estilos   | Inline styles         | Tailwind CSS            |
| UI        | Básica                | Gradientes y sombras    |
| Feedback  | Solo visual           | Visual + Audio          |
| Timer     | Variable global       | useState + useRef       |
| Idioma    | Inglés                | Español                 |
| Routing   | Componentes separados | Selector unificado      |

## Autor

Coach Virtual - Módulo de Yoga
Fecha: Noviembre 2025
