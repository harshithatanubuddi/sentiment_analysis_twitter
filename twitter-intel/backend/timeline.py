import pandas as pd

def build_timeline(df):
    # Ensure datetime
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Aggregate sentiment per 15-minute window
    timeline = (
        df
        .set_index("timestamp")
        .resample("15min")
        .agg({
            "sentiment_score": "mean",
            "tweet": "count"
        })
        .reset_index()
    )

    timeline["sentiment_score"] = timeline["sentiment_score"].fillna(0)

    spikes = []

    for i in range(1, len(timeline)):
        prev_score = timeline.loc[i - 1, "sentiment_score"]
        curr_score = timeline.loc[i, "sentiment_score"]
        diff = curr_score - prev_score

        # Detect strong negative spike
        if diff < -0.5:
            spike_time = timeline.loc[i, "timestamp"]

            # 🔥 EXTRACT TWEETS THAT CAUSED SPIKE
            spike_tweets = df[
                (df["timestamp"] >= spike_time - pd.Timedelta(minutes=15)) &
                (df["timestamp"] <= spike_time)
            ].sort_values("sentiment_score").head(3)

            spikes.append({
                "time": str(spike_time),
                "drop": round(abs(diff), 2),
                "tweets": spike_tweets["tweet"].tolist()
            })

    return timeline, spikes