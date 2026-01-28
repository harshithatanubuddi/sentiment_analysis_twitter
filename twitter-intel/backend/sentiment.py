import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"
LABELS = ["Negative", "Positive"]

_tokenizer = None
_model = None


def _load_model():
    global _tokenizer, _model

    if _tokenizer is None or _model is None:
        import torch
        torch.set_num_threads(1)  # critical for small servers

        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        _model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_NAME
        ).to("cpu")
        _model.eval()


def get_sentiment_batch(texts):
    """
    Batch sentiment analysis.
    Returns: list of (label, signed_score)
    signed_score ∈ [-1, 1]
    """

    if not texts:
        return []

    _load_model()

    import torch
    import torch.nn.functional as F

    inputs = _tokenizer(
        texts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=128
    )

    with torch.no_grad():
        outputs = _model(**inputs)
        probs = F.softmax(outputs.logits, dim=1)

    results = []
    for p in probs:
        score, idx = torch.max(p, dim=0)
        idx = idx.item()
        score = score.item()

        # DistilBERT: 0 = Negative, 1 = Positive
        if idx == 1:
            signed = score
            label = "Positive"
        else:
            signed = -score
            label = "Negative"

        results.append((label, signed))

    return results