import os
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
POSTS_FILE = "posts.json"


# ------------------ Helpers ------------------
def load_posts():
    if not os.path.exists(POSTS_FILE) or os.path.getsize(POSTS_FILE) == 0:
        return []
    with open(POSTS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_posts(posts):
    with open(POSTS_FILE, "w", encoding="utf-8") as f:
        json.dump(posts, f, indent=2)


def remove_file(file_url: str):
    if file_url and file_url.startswith("/uploads/"):
        filename = file_url.replace("/uploads/", "")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"⚠️ Could not delete file {file_path}: {e}")


# ------------------ Routes ------------------

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/posts", methods=["GET"])
def get_posts():
    return jsonify(load_posts())


@app.route("/posts", methods=["POST"])
def add_post():
    posts = load_posts()

    name = request.form.get("name", "")
    title = request.form.get("title", "")
    content = request.form.get("content", "")

    post = {
        "id": str(uuid.uuid4()),
        "name": name,
        "title": title,
        "content": content,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "image": None,
        "video": None,
        "comments": [],
        "likes": 0
    }

    image = request.files.get("image")
    if image and image.filename:
        filename = secure_filename(image.filename)
        path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(path)
        post["image"] = f"/uploads/{filename}"

    video = request.files.get("video")
    if video and video.filename:
        filename = secure_filename(video.filename)
        path = os.path.join(UPLOAD_FOLDER, filename)
        video.save(path)
        post["video"] = f"/uploads/{filename}"

    posts.append(post)
    save_posts(posts)
    return jsonify(post), 201


@app.route("/posts/<post_id>", methods=["DELETE"])
def delete_post(post_id):
    posts = load_posts()
    post_to_delete = None

    for p in posts:
        if p["id"] == post_id:
            post_to_delete = p
            break

    if not post_to_delete:
        return jsonify({"error": "Post not found"}), 404

    remove_file(post_to_delete.get("image"))
    remove_file(post_to_delete.get("video"))

    updated = [p for p in posts if p["id"] != post_id]
    save_posts(updated)
    return jsonify({"message": "Post deleted and files removed"})


@app.route("/posts/<post_id>/comments", methods=["POST"])
def add_comment(post_id):
    posts = load_posts()
    comment_data = request.get_json()
    if not comment_data or "text" not in comment_data:
        return jsonify({"error": "Invalid comment"}), 400

    for post in posts:
        if post["id"] == post_id:
            comment = {
                "id": str(uuid.uuid4()),
                "text": comment_data["text"],
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            post["comments"].append(comment)
            save_posts(posts)
            return jsonify(post)

    return jsonify({"error": "Post not found"}), 404


@app.route("/posts/<post_id>/comments/<comment_id>", methods=["DELETE"])
def delete_comment(post_id, comment_id):
    posts = load_posts()
    for post in posts:
        if post["id"] == post_id:
            post["comments"] = [c for c in post["comments"] if c["id"] != comment_id]
            save_posts(posts)
            return jsonify(post)
    return jsonify({"error": "Post not found"}), 404


@app.route("/posts/<post_id>/like", methods=["POST"])
def like_post(post_id):
    posts = load_posts()
    for post in posts:
        if post["id"] == post_id:
            post["likes"] += 1
            save_posts(posts)
            return jsonify({"likes": post["likes"]})
    return jsonify({"error": "Post not found"}), 404


if __name__ == "__main__":
    app.run(debug=True)
# ------------------ End of File ------------------
# To run the app, use the command: python app.py