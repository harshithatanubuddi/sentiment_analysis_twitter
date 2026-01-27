emotion_keywords = {
    "anger": ["angry", "hate", "worst", "furious", "annoying"],
    "joy": ["love", "great", "happy", "awesome", "amazing"],
    "sadness": ["sad", "disappointed", "cry", "upset"],
    "fear": ["scared", "worried", "afraid", "panic"],
}

def get_emotion(text: str) -> str:
    if not text:
        return "neutral"

    text = text.lower()

    for emotion, words in emotion_keywords.items():
        if any(word in text for word in words):
            return emotion

    return "neutral"