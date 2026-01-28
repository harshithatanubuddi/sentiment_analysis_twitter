#main.py2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime, timedelta
import random
import os

from sentiment import get_sentiment_batch
from emotion import get_emotion
from toxicity import is_toxic
from impact import impact_score



app = FastAPI()

# ✅ CORRECT CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Backend running"}

TRAIN_PATH = "data/twitter_training.csv"
VAL_PATH = "data/twitter_validation.csv"

def load_tweets():
    if not os.path.exists(TRAIN_PATH) or not os.path.exists(VAL_PATH):
        return pd.DataFrame(columns=["tweet", "timestamp", "likes", "retweets"])

    train_df = pd.read_csv(TRAIN_PATH, header=None, engine="python", on_bad_lines="skip")
    val_df = pd.read_csv(VAL_PATH, header=None, engine="python", on_bad_lines="skip")

    train_df.columns = ["id", "entity", "sentiment", "tweet"]
    val_df.columns = ["id", "entity", "sentiment", "tweet"]

    df = pd.concat([train_df, val_df], ignore_index=True)
    df.dropna(subset=["tweet"], inplace=True)
    df["tweet"] = df["tweet"].astype(str)

    df["likes"] = [random.randint(0, 50) for _ in range(len(df))]
    df["retweets"] = [random.randint(0, 20) for _ in range(len(df))]

    base_time = datetime.now() - timedelta(hours=6)
    df["timestamp"] = [base_time + timedelta(minutes=i) for i in range(len(df))]

    return df

df = load_tweets()

@app.get("/analyze")
def analyze(query: str):
    if df.empty:
        return {"tweets": [], "timeline": [], "message": "Dataset not loaded"}

    filtered = df[df["tweet"].str.contains(query, case=False, na=False)].head(50)

    if filtered.empty:
        return {"tweets": [], "timeline": [], "message": "No tweets found"}

    texts = filtered["tweet"].tolist()
    sentiments = get_sentiment_batch(texts)

    tweets = []
    for i, row in enumerate(filtered.itertuples()):
        label, score = sentiments[i]
        tweets.append({
            "tweet": row.tweet,
            "sentiment": label,
            "sentiment_score": round(score, 3),
            "emotion": get_emotion(row.tweet),
            "toxic": is_toxic(row.tweet),
            "impact": impact_score(score, row.likes, row.retweets),
            "timestamp": row.timestamp.strftime("%Y-%m-%d %H:%M"),
            "confidence": "high"
        })

    timeline = [{"timestamp": t["timestamp"], "sentiment_score": t["sentiment_score"]} for t in tweets]

    return {"tweets": tweets, "timeline": timeline}