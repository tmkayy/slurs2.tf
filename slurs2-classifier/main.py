from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()
classifier = pipeline("text-classification", model="Hate-speech-CNERG/dehatebert-mono-english")

class BatchMessage(BaseModel):
    texts: list[str]

@app.post("/classify-batch")
def classify_batch(batch: BatchMessage):
    results = classifier(batch.texts, truncation=True, max_length=512)
    return [{"label": r["label"], "score": r["score"]} for r in results]