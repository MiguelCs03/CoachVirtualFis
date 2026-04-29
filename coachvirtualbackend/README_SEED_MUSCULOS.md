# 🗄️ Script de Población de Base de Datos

## 📝 Descripción

Script Django para poblar automáticamente la base de datos con datos iniciales de músculos, ejercicios y detalles basado en `BD_MUSCULOS.md`.

## 🚀 Uso

### Comando básico
```bash
python manage.py seed_musculos
```

### Limpiar datos existentes antes de insertar
```bash
python manage.py seed_musculos --clear
```

> ⚠️ **ADVERTENCIA**: La opción `--clear` eliminará TODOS los datos existentes de las tablas `Tipo`, `Musculo`, `Ejercicio` y `DetalleMusculo` antes de insertar los nuevos datos.

## 📦 Datos que se insertan

### Tipos (2 registros)
- Principal
- Secundario

### Músculos (6 registros)
- Espalda
- Pectorales
- Abdominales
- Brazos
- Piernas
- Rodilla

### Ejercicios (18 registros)
Incluye ejercicios como:
- Remo sentado en máquina
- Flexiones
- Plancha
- Press de banca con mancuernas
- Y más...

### Detalles (28 registros)
Relaciones entre músculos, ejercicios y tipos con porcentajes de efectividad.

## 🔧 Cuándo usar este script

### ✅ Casos de uso recomendados:
1. **Primera configuración** de un servidor nuevo (producción/staging)
2. **Resetear datos de prueba** en desarrollo
3. **Migración** a un nuevo ambiente
4. **Recuperación** después de borrar datos accidentalmente

### ❌ NO usar si:
- Ya tienes datos personalizados en producción
- Los usuarios han creado rutinas basadas en estos ejercicios (se romperían las relaciones)

## 📋 Ejemplo de salida

```
============================================================
🚀 INICIANDO POBLACIÓN DE BASE DE DATOS
============================================================

📝 Insertando tipos...
  ✓ Tipo creado: Principal
  ✓ Tipo creado: Secundario

💪 Insertando músculos...
  ✓ Músculo creado: Espalda
  ✓ Músculo creado: Pectorales
  ...

🏋️  Insertando ejercicios...
  ✓ Ejercicio creado: Remo sentado en máquina
  ✓ Ejercicio creado: Flexiones
  ...

🔗 Insertando detalles músculo-ejercicio...
  ✓ Detalle creado: ID 1
  ✓ Detalle creado: ID 2
  ...

============================================================
✅ POBLACIÓN COMPLETADA
============================================================

📊 Resumen:
  - Tipos: 2
  - Músculos: 6
  - Ejercicios: 18
  - Detalles: 28
```

## 🛠️ Solución de problemas

### Error: "No module named 'musculos'"
**Solución**: Asegúrate de estar en el directorio correcto y que el entorno virtual esté activado.

```bash
cd coachvirtualbackend/coachvirtualback
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

### Error: "FOREIGN KEY constraint failed"
**Solución**: Usa la opción `--clear` para limpiar datos inconsistentes primero.

```bash
python manage.py seed_musculos --clear
```

### Error: "Table doesn't exist"
**Solución**: Ejecuta las migraciones primero.

```bash
python manage.py makemigrations
python manage.py migrate
```

## 📁 Ubicación del archivo

```
coachvirtualbackend/
└── coachvirtualback/
    └── musculos/
        └── management/
            └── commands/
                └── seed_musculos.py
```

## 🔄 Actualizar datos

Si necesitas actualizar los datos en `BD_MUSCULOS.md`:

1. Edita el archivo `BD_MUSCULOS.md`
2. Actualiza las listas de datos en `seed_musculos.py`
3. Ejecuta el comando con `--clear` para reemplazar todos los datos

## 🌐 Despliegue en servidor

Para usar en producción/staging:

```bash
# 1. Conectar al servidor
ssh usuario@servidor

# 2. Activar entorno virtual
source venv/bin/activate

# 3. Ejecutar migraciones
python manage.py migrate

# 4. Poblar datos iniciales
python manage.py seed_musculos

# 5. Verificar
python manage.py shell
>>> from musculos.models import Musculo
>>> Musculo.objects.count()
6
```

## 💡 Tips

- **Idempotente**: El comando usa `get_or_create()`, por lo que es seguro ejecutarlo múltiples veces sin duplicar datos.
- **IDs fijos**: Los IDs están hardcodeados para mantener consistencia entre ambientes.
- **Transacciones**: Django maneja las transacciones automáticamente, si algo falla, no se insertará nada.
