FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependencias
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Copia el código
COPY . /app

# Puerto por defecto (puede sobrescribirse en runtime por Railway)
ENV PORT=8000

# No ejecutar collectstatic en build (puede necesitar SECRET_KEY en tiempo de build)
# Ejecutamos migraciones y collectstatic al arrancar el contenedor para asegurar
# que las variables de entorno de Railway estén disponibles.
ENTRYPOINT ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn coachvirtualback.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
