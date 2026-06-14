FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip --quiet && pip install -r requirements.txt --no-cache-dir --quiet

COPY . .

RUN mkdir -p /app/staticfiles

EXPOSE $PORT

WORKDIR /app/coachvirtualback

CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn coachvirtualback.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
