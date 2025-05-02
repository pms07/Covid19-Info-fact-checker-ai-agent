import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key='##YOUR_OPENAI_API_KEY##')

def generate_summary(report_payload: str) -> str:
    system_prompt = (
        "You are a behavioral and social psychology analyst. "
        "Your job is to summarize how each agent's vaccine attitudes changed before and after news exposure, "
        "explaining what might have influenced them and why. "
        "Use reasons and exposure likelihoods to identify correlations. "
        "Summarize both population-level trends and notable individual shifts. "
        "Return a clear, compact summary report in English under 300 words."
    )

    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": report_payload}
                ]
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if attempt == max_retries - 1:
                raise Exception(f"Failed to generate summary after {max_retries} attempts. Last error: {str(e)}")
            continue