toxic_words = ["kill", "idiot", "stupid", "hate"]

def is_toxic(text):
    text = text.lower()
    return any(word in text for word in toxic_words)