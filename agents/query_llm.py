import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key='##YOUR_OPENAI_API_KEY##')


completion = client.chat.completions.create(
  model="gpt-4o-mini",
  store=True,
  messages=[
    {"role": "system", "content": "Answer your questions as concisely as possible."},
    {"role": "user", "content": "what is the capital of China?"}
  ]
)

print(completion.choices[0].message)