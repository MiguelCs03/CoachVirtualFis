FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip --quiet && \
    pip install -r requirements.txt --no-cache-dir --quiet && \
    pip install gunicorn[gevent] --no-cache-dir --quiet

COPY . .

RUN mkdir -p /app/staticfiles

EXPOSE $PORT

WORKDIR /app/coachvirtualback

CMD ["sh", "-c", "python manage.py collectstatic --noinput 2>/dev/null; gunicorn coachvirtualback.wsgi:application --bind 0.0.0.0:${PORT:-8000} --worker-class gevent --worker-connections 100 --workers 2 --timeout 30 --keep-alive 5 --log-level warning"]
