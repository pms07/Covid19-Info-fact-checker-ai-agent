import os, json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key='##YOUR_OPENAI_API_KEY##')

def analyze_exposure_likelihood(profile: str, news_list: list[str]) -> list[dict]:
    system_prompt = (
        "You are a sociological analyst estimating how likely a person is to encounter specific news articles, "
        "based on their demographic profile, beliefs, and media habits. "
        "For each article, return a likelihood value (0 to 1) and a concise justification. "
        "Output JSON array in the format: "
        '[{"article": "...", "likelihood": 0.75, "reason": "..."}]'
    )

    joined_news = "\n".join(f"{i+1}. {n}" for i, n in enumerate(news_list))
    user_prompt = f"""
Profile:
{profile}

Candidate news:
{joined_news}

Output JSON only.
"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={ "type": "json_object" }
            )
            content = resp.choices[0].message.content.strip()
            return json.loads(content)
        except json.JSONDecodeError as e:
            if attempt == max_retries - 1:
                raise Exception(f"Failed to get valid JSON response after {max_retries} attempts. Last error: {str(e)}")
            continue