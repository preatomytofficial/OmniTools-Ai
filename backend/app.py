"""
OmniTools AI - Flask Backend Controller
Author: PreatomYT (c) 2026
Offline Multi-Tool Platform with Personal LLM
"""

import os
import sys
import uuid
import json
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename

# Ensure local imports work cleanly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from llm_core import PersonalLLM
from tools.upscale import upscale_image
from tools.watermark_remove import remove_watermark
from tools.object_remove import remove_object
from tools.video_mp3 import convert_video_to_mp3
from tools.video_trim import trim_video

app = Flask(__name__)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Initialize personal LLM core
llm = PersonalLLM()

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "system": "OmniTools AI Local",
        "mode": "offline",
        "llm_model": llm.model_name
    })

@app.route("/llm-chat", methods=["POST"])
def llm_chat():
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    
    result = llm.generate_response(prompt)
    return jsonify(result)

@app.route("/upscale", methods=["POST"])
def route_upscale():
    if "file" not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files["file"]
    scale = int(request.form.get("scale", 4))
    
    filename = f"up_{uuid.uuid4().hex[:8]}_{secure_filename(file.filename or 'image.png')}"
    input_path = os.path.join(UPLOAD_DIR, filename)
    output_filename = f"upscaled_{scale}x_{filename}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    file.save(input_path)
    try:
        upscale_image(input_path, output_path, scale=scale)
        return send_file(output_path, as_attachment=True, download_name=output_filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/remove-watermark", methods=["POST"])
def route_watermark():
    if "file" not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files["file"]
    bx = int(request.form.get("x", 50))
    by = int(request.form.get("y", 50))
    bw = int(request.form.get("w", 120))
    bh = int(request.form.get("h", 60))
    
    filename = f"wm_{uuid.uuid4().hex[:8]}_{secure_filename(file.filename or 'image.png')}"
    input_path = os.path.join(UPLOAD_DIR, filename)
    output_filename = f"cleaned_{filename}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    file.save(input_path)
    try:
        remove_watermark(input_path, output_path, bbox=(bx, by, bw, bh))
        return send_file(output_path, as_attachment=True, download_name=output_filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/remove-object", methods=["POST"])
def route_remove_object():
    if "file" not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files["file"]
    bx = int(request.form.get("x", 100))
    by = int(request.form.get("y", 100))
    bw = int(request.form.get("w", 150))
    bh = int(request.form.get("h", 150))
    
    filename = f"obj_{uuid.uuid4().hex[:8]}_{secure_filename(file.filename or 'image.png')}"
    input_path = os.path.join(UPLOAD_DIR, filename)
    output_filename = f"erased_{filename}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    file.save(input_path)
    try:
        remove_object(input_path, output_path, bbox=(bx, by, bw, bh))
        return send_file(output_path, as_attachment=True, download_name=output_filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/video-mp3", methods=["POST"])
def route_video_mp3():
    if "file" not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    file = request.files["file"]
    bitrate = request.form.get("bitrate", "320k")
    
    filename = f"vid_{uuid.uuid4().hex[:8]}_{secure_filename(file.filename or 'video.mp4')}"
    input_path = os.path.join(UPLOAD_DIR, filename)
    output_filename = f"audio_{os.path.splitext(filename)[0]}.mp3"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    file.save(input_path)
    try:
        convert_video_to_mp3(input_path, output_path, bitrate=bitrate)
        return send_file(output_path, as_attachment=True, download_name=output_filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/trim-video", methods=["POST"])
def route_trim_video():
    if "file" not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    file = request.files["file"]
    start_time = float(request.form.get("start", 0.0))
    end_time = float(request.form.get("end", 10.0))
    fast_cut = request.form.get("fast", "false").lower() == "true"
    
    filename = f"trim_{uuid.uuid4().hex[:8]}_{secure_filename(file.filename or 'video.mp4')}"
    input_path = os.path.join(UPLOAD_DIR, filename)
    output_filename = f"trimmed_{filename}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    file.save(input_path)
    try:
        trim_video(input_path, output_path, start_time=start_time, end_time=end_time, fast_cut=fast_cut)
        return send_file(output_path, as_attachment=True, download_name=output_filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5000))
    print(f"Starting OmniTools AI backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
