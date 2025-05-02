from flask import Flask, jsonify, render_template, request, redirect, url_for, session
from flask_cors import CORS
import os
import json
from datetime import datetime
from cryptography.fernet import Fernet
from openai import OpenAI
import mysql.connector
from passlib.hash import bcrypt

# set up flask app
app = Flask(__name__)
app.secret_key = 'Rock@234'
CORS(app)

# load/save encryption key
KEY_FILE = "encryption.key"

# check if encryption key file exists
# if it does, load the key; if not, generate a new one
if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        ENCRYPTION_KEY = f.read()
else:
    ENCRYPTION_KEY = Fernet.generate_key()
    with open(KEY_FILE, "wb") as f:
        f.write(ENCRYPTION_KEY)

cipher = Fernet(ENCRYPTION_KEY)

# OpenAI API setup, will need to be replaced with your own key
client = OpenAI(
    api_key='##YOUR_OPENAI_API_KEY##',
)

# DB setup
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="chat_bud"
)
cursor = db.cursor()

# create variable to store chat history
sessionChat = []

# login/home page route
@app.route("/")
def index():
    # Check if user is logged in
    if 'username' in session:
        return render_template('chat.html')
    return redirect(url_for('login'))

# login function routes
@app.route("/login", methods=["GET", "POST"])
def login():
    # Check if user is already logged in
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        # Check if username and password are in the database
        cursor.execute("SELECT user_id, password FROM login WHERE username = %s", (username,))
        user_row = cursor.fetchone()

        # If user exists, check password
        if user_row:
            user_id_db, hashed_password_db = user_row
            if bcrypt.verify(password, hashed_password_db):
                session['username'] = username
                session['user_id'] = user_id_db

                # Check if there's an existing session, if not, create a new one
                new_session_id = create_new_chat_session(user_id_db)
                session['chat_session_id'] = new_session_id

                global sessionChat
                sessionChat = []

                return redirect(url_for('index'))
            return "Invalid password"
        return "User not found"
    return render_template('login.html')

# signup function routes
@app.route("/signup", methods=["POST"])
def signup():
    # Check for username and password
    if request.method == "POST":
        username = request.form["new_username"]
        password = request.form["new_password"]

        # Check if username is already taken
        cursor.execute("SELECT user_id FROM login WHERE username = %s", (username,))
        if cursor.fetchone():
            return "Username already exists"

        # Hash the password and store it in the database
        hashed_pw = bcrypt.hash(password)
        cursor.execute("INSERT INTO login (username, password) VALUES (%s, %s)", (username, hashed_pw))
        db.commit()

        # Get the user_id of the newly created user
        cursor.execute("SELECT user_id FROM login WHERE username = %s", (username,))
        user_id_db = cursor.fetchone()[0]

        # Create a new chat session for the user
        session['username'] = username
        session['user_id'] = user_id_db

        new_session_id = create_new_chat_session(user_id_db)
        session['chat_session_id'] = new_session_id

        global sessionChat
        sessionChat = []

        return redirect(url_for('index'))
    return render_template('signup.html')

# chat function route
@app.route("/get", methods=["POST"])
def chat():
    # set up global variable for chat history
    global sessionChat
    user_input = request.form["msg"]

    # save user input to sessionChat
    sessionChat.append({"role": "user", "content": user_input})

    # define system prompt and instructions
    system_prompt = (
        "You are a supportive mental health chatbot modeled on the DSM-5 guidelines."
        "Your goal is to engage in casual, empathetic conversations while providing general emotional support and information."
        "Keep responses relatively short, approachable, and warm, as if speaking to a friend."
        "Although you can draw on DSM-5 concepts for insight, avoid making a definitive diagnosis or giving strict medical advice."
        "Always acknowledge that you are not a licensed mental health professional and encourage users to seek professional care if needed."
    )

    # create messages for the OpenAI API
    messages = [{"role": "system", "content": system_prompt}] + sessionChat

    # try to get a response from OpenAI API with the user input and system prompt
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            temperature=0.6,
            messages=messages
        )
        reply = response.choices[0].message.content
        
        # save API response to sessionChat
        sessionChat.append({"role": "assistant", "content": reply})

        # Basic keyword safety check, append warning if needed
        # This is a simple check; in a real-world scenario, you would want to use a more robust method
        crisis_keywords = ["suicide", "self-harm", "harm others", "kill", "end it all"]
        if any(keyword in user_input.lower() for keyword in crisis_keywords):
            reply += (
                "\n\nIf you are in crisis or feeling overwhelmed, please seek immediate "
                "professional help or contact a trusted support network."
            )

        # Partial chat history save for the current session
        if 'chat_session_id' in session:
            encrypted = cipher.encrypt(json.dumps(sessionChat).encode())
            cursor.execute(
                "UPDATE chat_sessions SET encrypted_chat_data = %s WHERE session_id = %s",
                (encrypted, session['chat_session_id'])
            )
            db.commit()        

        return reply, 200
    except Exception as e:
        return f"Error: {str(e)}", 500

@app.route("/logout")
def logout():
    global sessionChat
    # Only save if we actually have messages in main chat menu
    if 'chat_session_id' in session and sessionChat:
        try:
            # Encrypt the chat data before saving
            encrypted = cipher.encrypt(json.dumps(sessionChat).encode())
            cursor.execute("""
                UPDATE chat_sessions SET session_end = %s, encrypted_chat_data = %s
                WHERE session_id = %s
            """, (datetime.now(), encrypted, session['chat_session_id']))
            db.commit()
        except Exception as e:
            print(f"Error saving chat session: {e}")

    session.clear()
    sessionChat = []

    return redirect(url_for('login'))

# chat history function route
@app.route("/chat_history", methods=["GET"])
def chat_history():
    # Check if user is logged in
    if 'user_id' not in session:
        return jsonify({"error": "User not logged in"}), 403

    # Fetch chat history from the database
    cursor.execute("""
        SELECT session_id, session_start, session_end, encrypted_chat_data
        FROM chat_sessions
        WHERE user_id = %s
        ORDER BY session_start DESC
    """, (session['user_id'],))
    rows = cursor.fetchall()

    # If no sessions found, return empty list
    session_list = []
    for (sid, start, end, encrypted) in rows:
        # Decrypt if possible
        if encrypted:
            try:
                decrypted = cipher.decrypt(encrypted)
                chat_data = json.loads(decrypted.decode())
            except Exception as e:
                print(f"Decryption failed for session {sid}: {e}")
                chat_data = []
        else:
            chat_data = []

        # Skip if it's empty (no messages at all)
        if not chat_data:
            continue

        # If it's the active session and not ended, label it "Current Chat"
        label = "Current Chat" if sid == session.get("chat_session_id") and not end else None

        # Format the start and end times
        session_list.append({
            "session_id": sid,
            "session_start": start.strftime("%Y-%m-%d %H:%M:%S"),
            "session_end": end.strftime("%Y-%m-%d %H:%M:%S") if end else None,
            "chat_data": chat_data,
            "custom_label": label
        })

    return jsonify(session_list), 200

# Function to create a new chat session
def create_new_chat_session(user_id):
    start_time = datetime.now()
    # Insert a new chat session into the database
    cursor.execute(
        "INSERT INTO chat_sessions (user_id, session_start) VALUES (%s, %s)",
        (user_id, start_time)
    )
    db.commit()
    return cursor.lastrowid

# main function to run the app
if __name__ == "__main__":
    app.run(debug=True)
