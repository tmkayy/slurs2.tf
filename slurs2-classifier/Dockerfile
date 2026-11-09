FROM python:3.11-slim
WORKDIR /app
RUN pip install fastapi uvicorn transformers torch --no-cache-dir
COPY main.py .
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='Hate-speech-CNERG/dehatebert-mono-english')"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]