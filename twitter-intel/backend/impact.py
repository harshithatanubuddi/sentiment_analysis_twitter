def impact_score(sentiment_score, likes, retweets):
    return abs(sentiment_score) * (likes + retweets + 1)