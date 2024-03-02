# Import necessary libraries
import json
import os
from dotenv import load_dotenv

# Importing the generativeai module from the google package
import google.generativeai as genai
from flask import Flask, jsonify, request, send_file, send_from_directory

from sensoroutput import sensor

# Load environment variables from a .env file
load_dotenv()
API_KEY = os.getenv('API_KEY')

# Configure the generativeai module with the provided API key
genai.configure(api_key=API_KEY)

# Create a Flask web application instance
app = Flask(__name__)

# Define the route for the root URL ("/"), serving the index.html file


@app.route("/")
def index():
    return send_file('web/index.html')

# Define an API route ("/api/generate") for content generation using the generative model


@app.route("/api/generate", methods=["POST"])
def generate_api():
    # Check if the request method is POST
    if request.method == "POST":
        # Check if API key is not set
        if API_KEY == 'TODO':
            return jsonify({"error": '''
                To get started, get an API key at
                https://makersuite.google.com/app/apikey and enter it in
                main.py
                '''.replace('\n', '')})
        try:
            sensor()
            # Get JSON content from the request body
            req_body = request.get_json()
            content = req_body.get("contents")

            # Create a GenerativeModel instance with the specified model name
            model = genai.GenerativeModel(model_name=req_body.get("model"))

            # Generate content using the model and stream the response
            response = model.generate_content(content, stream=True)

            # Define a generator function for streaming the content chunks
            def stream():
                for chunk in response:
                    yield 'data: %s\n\n' % json.dumps({"text": chunk.text})

            # Return the streamed content with the appropriate content type
            return stream(), {'Content-Type': 'text/event-stream'}

        except Exception as e:
            # Return an error message if an exception occurs during content generation
            return jsonify({"error": str(e)})

# Define a route to serve static files from the 'web' directory


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('web', path)


# Run the Flask app on the specified port (default: 3002)
if __name__ == "__main__":
    app.run(port=int(os.environ.get('PORT', 3002)))
