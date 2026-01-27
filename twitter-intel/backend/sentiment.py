# sentiment.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"

# Load once (CRITICAL)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()

LABELS = ["Negative", "Neutral", "Positive"]

def get_sentiment_batch(texts):
    """
    Batch sentiment analysis.
    Returns: list of (label, signed_score)
    signed_score ∈ [-1, 1]
    """

    if not texts:
        return []

    inputs = tokenizer(
        texts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=128
    )

    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=1)

    results = []
    for p in probs:
        score, idx = torch.max(p, dim=0)
        idx = idx.item()
        score = score.item()

        if idx == 2:        # Positive
            signed = score
        elif idx == 0:      # Negative
            signed = -score
        else:               # Neutral
            signed = 0.0

        results.append((LABELS[idx], signed))

    return results