
# Backend - Coach Virtual

Este archivo describe los pasos y comandos para arrancar el backend (Django) en desarrollo y opciones básicas de despliegue.

## Requisitos

- Python 3.8+ instalado
- Git (opcional)
- En Windows: PowerShell (esta guía usa PowerShell)

## Estructura y ubicación

El código del backend se encuentra en la carpeta `coachvirtualback` dentro de este repositorio. El archivo principal de gestión es `manage.py` y la base de datos por defecto es SQLite (`db.sqlite3`).

Ruta de trabajo recomendada (desde el root del repositorio):

```
cd .\coachvirtualbackend\coachvirtualback
```

## Pasos para configurar y arrancar (PowerShell)

1) Crear y activar un entorno virtual

```powershell
# Ir a la carpeta del backend
cd .\coachvirtualbackend\coachvirtualback

# Crear el virtualenv (usa el intérprete 'python' disponible)
python -m venv .venv


# Activar el virtualenv (PowerShell)
.      .\.venv\Scripts\Activate.ps1
```

2) Actualizar pip e instalar dependencias

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

3) Variables de entorno

- Existe un fichero `.env` en la carpeta del proyecto (`coachvirtualback/.env`). Asegúrate de que contiene las variables necesarias (por ejemplo SECRET_KEY, DEBUG, configuración de Stripe u otras). Si no existe, crea uno o exporta las variables en el entorno antes de ejecutar el proyecto.

DB_NAME=coach_vitual
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=127.0.0.1
DB_PORT=5432

STRIPE_SECRET_KEY=API KEY

4) Migraciones y base de datos

```powershell
# Crear/actualizar migraciones locales (si se han modificado modelos)
python manage.py makemigrations

# Aplicar migraciones sobre la base de datos (SQLite por defecto)
python manage.py migrate
```

5) (Opcional) Crear un superusuario

```powershell
python manage.py createsuperuser
```

6) Ejecutar el servidor de desarrollo

```powershell
# Arranca el servidor en 0.0.0.0:8000 para que sea accesible desde otras máquinas de la red
python manage.py runserver 0.0.0.0:8000
```

7) Ejecutar tests (si quieres verificar)

```powershell
python manage.py test
```

## Opciones de despliegue (rápidas)

- En Windows puedes usar Waitress (WSGI) para producción ligera:

```powershell
pip install waitress
waitress-serve --port=8000 coachvirtualback.wsgi:application
```

- En Linux/servicios contenedorizados, usa Gunicorn (o tu servidor WSGI favorito):

```bash
# En Linux
pip install gunicorn
gunicorn coachvirtualback.wsgi:application --bind 0.0.0.0:8000
```

## Notas y resolución de problemas

- Si PowerShell no permite ejecutar el script de activación, la línea `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force` en la sesión actual lo salva sin cambiar la política del sistema.
- Si el proyecto usa variables que no están en `.env`, revisa `coachvirtualback/settings.py` para saber qué variables espera el proyecto.
- La base de datos por defecto es `db.sqlite3` incluida en `coachvirtualback/`. Si cambias a PostgreSQL u otro motor, configura las variables y crea la base de datos antes de ejecutar `migrate`.

---

Si quieres, puedo añadir además una tarea npm/package.json script o un archivo PowerShell `.ps1` que automatice estos pasos.

