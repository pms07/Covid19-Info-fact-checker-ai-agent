from flask import Flask, render_template, request, jsonify, session, send_from_directory
from flask_session import Session
import json
import uuid
import random
from datetime import datetime
import os
import requests
from dotenv import load_dotenv
from simulate import run_simulation
load_dotenv()
 
NEWSAPI_KEY = '##' # os.getenv('NEWSAPI_API_KEY')
RAPIDAPI_API_KEY = '##' # os.getenv('RAPIDAPI_API_KEY')
APIFY_KEY = '##' # os.getenv('APIFY_API_KEY')
FACTCHECKER_KEY = '##' # os.getenv('FACTCHECKER_API_KEY')
# ------------------------------------------------------------------ #
 
app = Flask(__name__)
app.secret_key = 'vaccine_hesitancy_simulation_secret_key'
 
# ---- server-side session config ----
app.config["SESSION_TYPE"] = "filesystem"      # simple file-based storage
app.config["SESSION_FILE_DIR"] = "./flask_sess"  # folder will be auto-created
app.config["SESSION_PERMANENT"] = False        # cookie expires with browser
Session(app)  
 
# ------------------------------------------------------------------ #
#  Session initialisation                                            #
# ------------------------------------------------------------------ #
@app.before_request
def init_session():
    if "agents" not in session:
        session["agents"] = initial_agents.copy()
    if "news" not in session:
        session["news"] = initial_news.copy()
 
# ------------------------------------------------------------------ #
#  UI route                                                          #
# ------------------------------------------------------------------ #
@app.route("/")
def index():
    return render_template("index.html")
 
# ------------------------------------------------------------------ #
#  CRUD: agents                                                      #
# ------------------------------------------------------------------ #
@app.route("/api/agents", methods=["GET"])
def get_agents():
    return jsonify(session["agents"])
 
@app.route("/api/agents", methods=["POST"])
def add_agent():
    data = request.json
    data["id"] = f"agent-{uuid.uuid4()}"
    session["agents"].append(data)
    return jsonify(data)
 
@app.route("/api/agents/<aid>", methods=["PUT"])
def update_agent(aid):
    data = request.json
    for i, a in enumerate(session["agents"]):
        if a["id"] == aid:
            session["agents"][i] = data
            return jsonify(data)
    return jsonify({"error": "Agent not found"}), 404
 
@app.route("/api/agents/<aid>", methods=["DELETE"])
def delete_agent(aid):
    session["agents"] = [a for a in session["agents"] if a["id"] != aid]
    return jsonify({"success": True})
 
# ------------------------------------------------------------------ #
#  CRUD: news                                                        #
# ------------------------------------------------------------------ #
@app.route("/api/news", methods=["GET"])
def get_news():
    return jsonify(session["news"])
 
@app.route("/api/news", methods=["POST"])
def add_news():
    data = request.json
    data["id"] = f"news-{uuid.uuid4()}"
    session["news"].append(data)
    return jsonify(data)
 
@app.route("/api/news/<nid>", methods=["PUT"])
def update_news(nid):
    data = request.json
    for i, n in enumerate(session["news"]):
        if n["id"] == nid:
            session["news"][i] = data
            return jsonify(data)
    return jsonify({"error": "News item not found"}), 404
 
@app.route("/api/news/<nid>", methods=["DELETE"])
def delete_news(nid):
    session["news"] = [n for n in session["news"] if n["id"] != nid]
    return jsonify({"success": True})
 
@app.route("/api/news/reorder", methods=["POST"])
def reorder_news():
    session["news"] = request.json or []
    return jsonify({"success": True})
 
# ------------------------------------------------------------------ #
#  Remote-news collector                                            #
# ------------------------------------------------------------------ #
def collect_news(query="vaccine", max_per_source=10):
    collected = []
 
    # build a COVID-filtered query
    covid_terms = "(covid OR covid-19 OR coronavirus) AND vaccine"
    final_query = f"{query} AND {covid_terms}"
 
    # 1) NewsAPI.org
    if NEWSAPI_KEY:
        r = requests.get(f"https://newsapi.org/v2/everything?q={covid_terms}&apiKey={NEWSAPI_KEY}")
        # r = requests.get(
        #     f"https://newsapi.org/v2/everything?q=covid&apiKey={NEWSAPI_KEY}",
        #     params={
        #         "q":         final_query,
        #         "pageSize":  max_per_source,
        #         "language":  "en",
        #         "sources":   "cbc-news,cnn,ctv-news",
        #         "apiKey":    NEWSAPI_KEY,
        #     },
        #     timeout=10,
        #)
        if r.ok:
            for art in r.json().get("articles", []):
                verdict = get_factcheck_verdict(art["title"])
                if verdict == "Unknown":
                    verdict = "True" if random.random() > 0.5 else "Fake"
                collected.append({
                    "id":           f"news-{uuid.uuid4()}",
                    "title":        art["title"],
                    "truthfulness": verdict,
                    "sentiment":    "Neutral",
                    "content":      art["description"] or "",
                    "source":       art["source"]["name"],
                    "url":          art["url"],
                    "publishedAt":  art["publishedAt"],
                })
 
    # 2) Apify demo dataset (BBC COVID feed)
    # params = {
    #     "clean":  "1",
    #     "format": "json",
    #     "limit":  max_per_source,
    #     "token":  APIFY_KEY,        # ← this line is critical
    # }
    # r = requests.get(
    #     #f"https://newsapi.org/v2/everything?q=covid&apiKey={APIFY_KEY}",
    #     params=params,
    #     timeout=10,
    # )
    # app.logger.debug(f"Apify response {r.status_code}: {r.text[:200]}")
 
    # if r.ok:
    #     items = r.json()
    #     if not items:
    #         app.logger.warning("collect_news: Apify returned 0 items")
    #     for art in items:
    #         title = (art.get("title") or "").lower()
    #         desc  = (art.get("description") or "").lower()
    #         # only include if it mentions COVID
    #         if "covid" not in title and "covid" not in desc:
    #             continue
    #         collected.append({
    #             "id":           f"news-{uuid.uuid4()}",
    #             "title":        art.get("title"),
    #             "truthfulness": "True",
    #             "sentiment":    "Neutral",
    #             "content":      art.get("description", ""),
    #             "source":       art.get("source", "BBC (Apify)"),
    #             "url":          art.get("url"),
    #             "publishedAt":  art.get("datePublished"),
    #         })
    # else:
    #     app.logger.error(f"Apify error: {r.status_code} {r.text}")
 
    return collected[:15]
 
@app.route("/api/news/fetch", methods=["POST"])
def fetch_news():
    body  = request.json or {}
    query = body.get("query", "covid vaccine")
    lim   = int(body.get("max", 10))
 
    fresh = collect_news(query=query, max_per_source=lim)
    session["news"].extend(fresh)
    return jsonify({"added": len(fresh), "total": len(session['news'])})
 
# ------------------------------------------------------------------ #
#  Simulation + profile (kept identical to your originals)           #
# ------------------------------------------------------------------ #
def simulate_responses(agents, news):
    results = []
 
    for agent in agents:
        attitude_change = 0
        reasoning = ""
 
        for item in news:
            item_influence = 0
 
            # ------------- Truthfulness factor -------------
            if item["truthfulness"] == "True":
                item_influence += 0.2
            else:  # Fake
                if agent.get("education") in ["PhD", "Master's"]:
                    item_influence -= 0.1
                else:
                    item_influence += 0.1
 
            # ------------- Sentiment factor ----------------
            if item["sentiment"] == "Pro-vaccine":
                item_influence += 0.2
            elif item["sentiment"] == "Anti-vaccine":
                item_influence -= 0.2
            elif item["sentiment"] == "Fear-based":
                item_influence -= 0.3 if agent["age"] > 60 else 0.1
 
            # ------------- Personality factor --------------
            traits = agent.get("traits", "")
            if "analytical" in traits or "scientific" in traits:
                item_influence *= 1.5 if item["truthfulness"] == "True" else 0.5
            if "skeptical" in traits:
                item_influence *= 0.7
            if "trusting" in traits:
                item_influence *= 1.3
 
            attitude_change += item_influence
            reasoning += (
                f"{item['title']}: "
                f"{'Positive' if item_influence>0 else 'Negative' if item_influence<0 else 'Neutral'} influence. "
            )
 
        # clamp to [-1,1]
        attitude_change = max(-1, min(1, attitude_change))
        new_attitude = agent["attitude"] + attitude_change
        new_attitude = round(max(-1, min(1, new_attitude)))
 
        results.append(
            {
                "agentId": agent["id"],
                "newAttitude": new_attitude,
                "reasoning": reasoning,
            }
        )
 
    # ---------------- summary -----------------
    pos = sum(
        1
        for r in results
        if next((a for a in agents if a["id"] == r["agentId"]), {}).get("attitude", 0)
        < r["newAttitude"]
    )
    neg = sum(
        1
        for r in results
        if next((a for a in agents if a["id"] == r["agentId"]), {}).get("attitude", 0)
        > r["newAttitude"]
    )
    neu = len(results) - pos - neg
 
    summary = (
        f"Simulation complete. {pos} agents became more positive toward vaccination, "
        f"{neg} became more negative, and {neu} remained unchanged. "
    )
    if pos > neg:
        summary += "Overall, the news exposure had a positive effect on vaccine attitudes."
    elif neg > pos:
        summary += "Overall, the news exposure had a negative effect on vaccine attitudes."
    else:
        summary += "Overall, the news exposure had a mixed or neutral effect on vaccine attitudes."
 
    return {"results": results, "summary": summary}
 
@app.route("/api/simulate", methods=["POST"])
def simulate():
    # Convert agents to profile strings
    profiles = []
    for agent in session["agents"]:
        profile = f"Age: {agent['age']}, Gender: {agent['gender']}"
        if agent.get('education'):
            profile += f", Education: {agent['education']}"
        if agent.get('income'):
            profile += f", Income: {agent['income']}"
        if agent.get('traits'):
            profile += f", {agent['traits']}"
        profiles.append(profile)

    # Convert news to list of strings
    news_pool = [item['title'] for item in session["news"]]

    # Standard survey questions
    survey = (
        "1. Do you believe the COVID-19 vaccine is safe?\n"
        "2. Do you intend to get vaccinated?\n"
        "3. How much do you trust government health advice?"
    )

    # Run simulation
    report_filename = run_simulation(profiles, news_pool, survey)
    
    # Return success response
    return jsonify({
        "success": True,
        "report_filename": report_filename,
        "summary": "Simulation completed successfully. Check the generated report for details."
    })
@app.route("/api/generate-profile", methods=["POST"])
def gen_profile():
    age, gender = request.json.get("age"), request.json.get("gender")
    return jsonify(generate_agent_profile(age, gender))
 
@app.route("/api/reset", methods=["POST"])
def reset():
    session["agents"] = initial_agents.copy()
    session["news"]   = initial_news.copy()
    return jsonify({"success": True})
 
# ------------------------------------------------------------------ #
#  Mini generators + seed data (unchanged from you)                  #
# ------------------------------------------------------------------ #
def generate_agent_profile(age, gender):
    income = "Low" if age < 25 else "Middle"
    return {"income": income, "education": "Bachelor's", "attitude": 0, "traits": "analytical"}
 
initial_agents = [
    {"id":"agent-1","age":65,"gender":"Male","attitude":0,"income":"Middle","education":"High School","traits":"cautious, traditional"},
    {"id":"agent-2","age":32,"gender":"Female","attitude":1,"income":"High","education":"Master's","traits":"analytical, health-conscious"},
]
 
initial_news = [
    {"id":"news-1","title":"New Study Shows Vaccine Effectiveness at 95%","truthfulness":"True","sentiment":"Pro-vaccine","content":"Peer-reviewed study…","source":"Medical Journal"}
]
 
@app.route("/api/news/clear", methods=["POST"])
def clear_all_news():
    session["news"] = []
    return jsonify({"success": True})
 
def get_factcheck_verdict(title, description="", language="en"):
    """
    Call Google Fact Check Tools API (claims:search).
    - Timeout after 3s.
    - On any error, return "Unknown" (so UI can fallback).
    """
    query_text = " ".join((title + " " + description).split()[:8])
    url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
    params = {
        "query":        query_text,
        "languageCode": language,
        "key":          FACTCHECKER_KEY,
    }
    try:
        resp = requests.get(url, params=params, timeout=3)
        resp.raise_for_status()
    except requests.exceptions.RequestException as e:
        app.logger.error(f"FactCheck API error for `{query_text}`: {e}")
        return "Unknown"
 
    data = resp.json()
    for claim in data.get("claims", []):
        for review in claim.get("claimReview", []):
            tr = (review.get("textualRating") or "").lower()
            if "false" in tr:
                return "Fake"
            if "true" in tr:
                return "True"
            rr = review.get("reviewRating", {}).get("rating", "").lower()
            if "false" in rr:
                return "Fake"
            if "true" in rr:
                return "True"
 
    return "Unknown"

@app.route('/data/<path:filename>')
def serve_simulation_report(filename):
    return send_from_directory('data', filename)

# ------------------------------------------------------------------ #
if __name__ == "__main__":
    app.run(debug=True)