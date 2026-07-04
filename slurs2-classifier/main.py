from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()
classifier = pipeline("text-classification", model="cardiffnlp/twitter-roberta-base-offensive")

class Message(BaseModel):
    text: str

@app.post("/classify")
def classify(message: Message):
    result = classifier(message.text, truncation=True, max_length=512)[0]
    return {
        "label": result["label"],
        "score": result["score"]
    }