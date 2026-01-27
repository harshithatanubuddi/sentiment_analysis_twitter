NEGATIVE_KEYWORDS = [
    "worst", "hate", "terrible", "awful", "bad",
    "trash", "garbage", "pathetic", "disappointing",
    "boring", "useless"
]

POSITIVE_KEYWORDS = [
    "love", "amazing", "great", "awesome", "fantastic",
    "excellent", "best"
]

def intent_override(text, score):
    text_lower = text.lower()

    neg_hits = sum(1 for w in NEGATIVE_KEYWORDS if w in text_lower)
    pos_hits = sum(1 for w in POSITIVE_KEYWORDS if w in text_lower)

    # Strong negative intent override
    if neg_hits >= 2 and score > 0:
        return score - 0.6, "low"

    # Mixed sentiment
    if neg_hits > 0 and pos_hits > 0:
        return score * 0.4, "low"

    return score, "high"