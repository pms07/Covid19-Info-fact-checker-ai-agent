# ChatBud: A Secure Mental Health Chatbot

ChatBud is a privacy-focused, AI-driven mental health chatbot. It offers general emotional support, references DSM-5 guidelines for insights, and provides a basic safety keyword check for conversations that may indicate a crisis. While **ChatBud** is **not** a substitute for professional therapy, it aims to be an accessible, immediate support tool for students experiencing stress or uncertainty.

---

## Features
- **Real-Time Chat**: Students converse with an AI-based chatbot in a user-friendly web interface.  
- **DSM-5–Informed Guidance**: The chatbot draws on DSM-5 concepts to offer general coping strategies, but does not provide official diagnoses.  
- **Safety Keyword Check**: Crisis detection triggers a disclaimer recommending immediate professional help if words like “suicide,” “kill,” or “self-harm” appear in user input.  
- **Secure Login**: Users sign up or log in, with hashed passwords for credential protection.  
- **Encrypted Chat History**: Conversation data is stored in a MySQL database with server-side encryption (Fernet).  
- **Sidebar for Past Sessions**: Users can view their previous chat sessions, which remain fully encrypted and only decrypted when requested by the logged-in user.

---

## Technologies Used
- **Python (Flask)**: Handles routing, API calls, and encryption.  
- **OpenAI GPT-4o** API: Provides the AI’s conversational capabilities.  
- **MySQL**: Stores user credentials and encrypted chat logs.  
- **HTML/CSS/JavaScript**: Powers the front-end chat interface and session display.  
- **Fernet** (from the `cryptography` library): Manages encryption and decryption of chat logs.

---

## Setup & Installation
- Clone the repository
- Input your Open AI API key on line 33 of app.py, or direct it to your environment variables
- Install the required packages using pip:
```bash
pip install -r requirements.txt
```
- Set up a MySQL database and create a table for user credentials and chat logs.
- Update the database connection details in `app.py`.
- run the Flask app:
```bash
python app.py
```