import os, json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key='##YOUR_OPENAI_API_KEY##')

def simulate_normal_agent(profile: str, news_context: str, survey_questions: str) -> dict:
    system_prompt = (
        "You are simulating a real human being with fixed personality traits and background. "
        "You must strictly adopt this person's perspective, without any external knowledge or bias. "
        "If provided with news context (with exposure probability and reasons), you should interpret it as the person would. "
        "Answer each survey question based on the person's beliefs and knowledge, and give a reason for each answer. "
        "Output must be JSON format: "
        '{"answers":[{"question":"...","answer":"...","reason":"..."}]}'
    )

    user_prompt = f"""
Profile:
{profile}

News context (may include exposure probability):
{news_context}

Survey questions: 
{survey_questions}

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