FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Sem shell no Render free: o seed de demonstração roda na subida (é idempotente).
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && if [ \"$KAMBY_DEMO\" = 1 ]; then python manage.py seed_demo; fi && gunicorn config.wsgi -b 0.0.0.0:${PORT:-8000} -w ${WEB_CONCURRENCY:-3}"]
