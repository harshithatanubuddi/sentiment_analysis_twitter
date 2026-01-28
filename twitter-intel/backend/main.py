from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from datetime import datetime, timedelta
import random
import os

from sentiment import get_sentiment_batch
from emotion import get_emotion
from toxicity import is_toxic
from impact import impact_score

app = FastAPI()

# ---------- CORS (FIXED) ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow all origins
    allow_methods=["*"],
    allow_headers=["*"],
)

TRAIN_PATH = "data/twitter_training.csv"
VAL_PATH = "data/twitter_validation.csv"

# ---------- GLOBAL CACHE ----------
_df_cache = None

# ---------- HEALTH ----------
@app.get("/")
def root():
    return {"status": "Backend running"}

# ---------- LOAD DATA (LAZY) ----------
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

    # Fake engagement (demo-safe)
    df["likes"] = [random.randint(0, 50) for _ in range(len(df))]
    df["retweets"] = [random.randint(0, 20) for _ in range(len(df))]

    # Fake timestamps
    base_time = datetime.now() - timedelta(hours=6)
    df["timestamp"] = [base_time + timedelta(minutes=i) for i in range(len(df))]

    return df


def get_dataframe():
    global _df_cache
    if _df_cache is None:
        _df_cache = load_tweets()
    return _df_cache


# ---------- ANALYZE ----------
@app.get("/analyze")
def analyze(query: str):
    query = query.strip()
    df = get_dataframe()

    if df.empty:
        return JSONResponse(content={
            "tweets": [],
            "timeline": [],
            "message": "Dataset not loaded"
        })

    filtered = df[
        df["tweet"].str.contains(query, case=False, na=False, regex=False)
    ].head(50)

    if filtered.empty:
        return JSONResponse(content={
            "tweets": [],
            "timeline": [],
            "message": "No tweets found"
        })

    texts = filtered["tweet"].tolist()
    sentiments = get_sentiment_batch(texts)

    tweets = []

    for i, row in enumerate(filtered.itertuples()):
        sentiment_label, sentiment_score = sentiments[i]
        emotion = get_emotion(row.tweet)
        toxic = is_toxic(row.tweet)

        mixed_signal = (
            sentiment_score > 0.3 and emotion in ["anger", "sadness", "fear"]
        ) or (
            sentiment_score < -0.3 and emotion == "joy"
        )

        tweets.append({
            "tweet": row.tweet,
            "sentiment": sentiment_label,
            "sentiment_score": round(sentiment_score, 3),
            "emotion": emotion,
            "toxic": toxic,
            "impact": impact_score(sentiment_score, row.likes, row.retweets),
            "timestamp": row.timestamp.strftime("%Y-%m-%d %H:%M"),
            "confidence": "low" if mixed_signal else "high"
        })

    timeline = (
        pd.DataFrame(tweets)
        .sort_values("timestamp")
        [["timestamp", "sentiment_score"]]
        .to_dict(orient="records")
    )

    return JSONResponse(content={
        "tweets": tweets,
        "timeline": timeline
    })