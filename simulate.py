#!/usr/bin/env python3
import openai
import json, uuid, datetime, webbrowser
from pathlib import Path
import html
 
# ─── 1. Hard-code your key ───────────────────────────────────────────────────────
OPENAI_API_KEY = "##YOUR_OPENAI_API_KEY##"
openai.api_key = OPENAI_API_KEY
 
# ─── 2. Import your agent functions ────────────────────────────────────────────
from agents.normal_agent   import simulate_normal_agent
from agents.decision_agent import analyze_exposure_likelihood
from agents.summary_agent  import generate_summary
 
# ─── 3. Prepare output directory ──────────────────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
 
def run_simulation(profiles: list[str], news_candidates: list[str], survey_questions: str):
    sim_id      = uuid.uuid4().hex[:8]
    timestamp   = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    report_html = DATA_DIR / f"simulation_{sim_id}_{timestamp}.html"
 
    # (We skip saving raw JSON here since we only need the summary in HTML.)
 
    # Run through agents just to collect results for summary
    all_results = []
    for idx, profile in enumerate(profiles):
        # Baseline + decision + post-news
        baseline  = simulate_normal_agent(profile, "", survey_questions)
        decision  = analyze_exposure_likelihood(profile, news_candidates)
        news_ctx  = json.dumps(decision, ensure_ascii=False, indent=2)
        post_news = simulate_normal_agent(profile, news_ctx, survey_questions)
 
        all_results.append({
            "agent_id":      f"agent_{idx+1}",
            "profile":       profile,
            "decision":      decision,
            "survey_before": baseline,
            "survey_after":  post_news
        })
 
    # Generate summary text
    raw_json     = json.dumps(all_results, ensure_ascii=False, indent=2)
    summary_text = generate_summary(raw_json)
 
    # Strip out Markdown bold markers and escape HTML
    clean = summary_text.replace("**", "")
    escaped = html.escape(clean)
 
    # Convert double-newlines into paragraphs
    paragraphs = escaped.split("\n\n")
    html_paragraphs = "".join(f"<p>{p.replace(chr(10), '<br>')}</p>" for p in paragraphs)
 
    # Build minimal HTML showing only the summary
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Simulation {sim_id} Summary</title>
  <style>
    body {{ font-family: sans-serif; margin: 2rem; line-height: 1.6; }}
    h1 {{ color: #333; }}
    p {{ margin-bottom: 1rem; }}
  </style>
</head>
<body>
  <h1>Simulation Report: {sim_id}</h1>
  <p><em>Generated on {timestamp}</em></p>
  {html_paragraphs}
</body>
</html>"""
 
    report_html.write_text(html_content, encoding="utf-8")
    print(f"\n✅ HTML summary saved to {report_html}")

    # Open it automatically
    webbrowser.open(report_html.as_uri())

if __name__ == "__main__":
    profiles = [
        "Age: 28, Gender: Female, Education: High school, Income: Low, Prefers natural remedies, Uses TikTok heavily",
        "Age: 45, Gender: Male, Education: Master's degree, Income: High, Trusts government, Reads traditional news daily"
    ]
 
    news_pool = [
        "A viral TikTok video claiming the vaccine causes infertility",
        "A peer-reviewed study in NEJM showing vaccine effectiveness",
        "A government PSA about vaccine safety aired on TV",
        "A blog post advocating for vitamin therapy over vaccines"
    ]
 
    survey = (
        "1. Do you believe the COVID-19 vaccine is safe?\n"
        "2. Do you intend to get vaccinated?\n"
        "3. How much do you trust government health advice?"
    )
 
    run_simulation(profiles, news_pool, survey)