# syntax=docker/dockerfile:1.7
#
# BuzzyHive flask-ml image: the KNN readiness API served by gunicorn.
# Build context is this folder (ml/):   docker build -t flask-ml ml
#
# Why each choice was made is written up in the infrastructure repository,
# docs/docker.md.

FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Serving dependencies only. The training stack (pandas, matplotlib) stays in
# requirements.txt and out of this image.
COPY requirements-serve.txt ./
# The test suites bundled inside numpy, scipy and scikit-learn are never imported
# at runtime; removing them in the same layer keeps the image smaller.
RUN pip install -r requirements-serve.txt \
    && find /usr/local/lib/python3.12/site-packages -type d -name tests -prune -exec rm -rf {} +

COPY app.py runtime.py model.pkl scaler.pkl model_metadata.json dataset.csv ./

# Fail the build, not the first request, if the pickle was made with a
# different scikit-learn than the one installed above.
RUN python -c "import pickle; pickle.load(open('model.pkl','rb')); pickle.load(open('scaler.pkl','rb')); print('model and scaler load ok')"

RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin app
USER app

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:5000/health', timeout=2).status == 200 else 1)"

# One worker and four threads: the container gets a fraction of a CPU, the model
# is tiny, and a single process keeps memory low. Scale out with replicas.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--threads", "4", "--timeout", "30", "--access-logfile", "-", "app:app"]
