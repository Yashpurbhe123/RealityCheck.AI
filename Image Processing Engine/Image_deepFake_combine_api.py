# File: Image_deepFake_combine_api.py
# Run: python Image_deepFake_combine_api.py

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps
import numpy as np
import os
import validators
import os
import validators
from io import BytesIO
import requests
import requests
import easyocr
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
import uvicorn

# -------------------------------
# Load environment variables
# -------------------------------
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

# -------------------------------
# CONFIG
# -------------------------------
MODEL_ID = "prithivMLmods/Deep-Fake-Detector-v2-Model"
THRESHOLD_FAKE = 0.20

# -------------------------------
# Initialize FastAPI
# -------------------------------
app = FastAPI(
    title="🧠 Image Text & DeepFake Detector API",
    description="API to extract text and detect DeepFake (Real vs AI-generated image).",
    version="1.0",
)

# -------------------------------
# Initialize Hugging Face Client
# -------------------------------
if not HF_TOKEN:
    raise ValueError("❌ HF_TOKEN not found in .env file!")

client = InferenceClient(provider="hf-inference", api_key=HF_TOKEN)

# -------------------------------
# Load EasyOCR Model
# -------------------------------
reader = easyocr.Reader(["en"], gpu=True)

# -------------------------------
# Helper Functions
# -------------------------------
def load_image_from_url(url: str) -> Image.Image:
    """Load image from a given URL."""
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return Image.open(BytesIO(resp.content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load image from URL: {str(e)}")


def classify_image(img: Image.Image):
    """Classify image using Hugging Face DeepFake model."""
    try:
        temp_path = "temp_image.jpg"
        img.save(temp_path, format="JPEG", quality=95)

        results = client.image_classification(temp_path, model=MODEL_ID)

        if os.path.exists(temp_path):
            os.remove(temp_path)

        fake_score = 0.0
        real_score = 0.0
        for r in results:
            label = r["label"].lower()
            score = float(r["score"])
            if "fake" in label:
                fake_score = max(fake_score, score)
            elif "real" in label:
                real_score = max(real_score, score)

        if fake_score > real_score and fake_score > THRESHOLD_FAKE:
            return {"verdict": "Fake", "confidence": fake_score}
        elif real_score >= fake_score:
            return {"verdict": "Real", "confidence": real_score}
        else:
            return {"verdict": "Uncertain", "confidence": 0.0}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hugging Face API error: {e}")


def extract_text_from_image(image: Image.Image):
    """Extract text using EasyOCR."""
    try:
        gray_image = ImageOps.grayscale(image)
        gray_np = np.array(gray_image)
        result = reader.readtext(gray_np, detail=0)
        return "\n".join(result) if result else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

# -------------------------------
# API Endpoint
# -------------------------------
@app.post("/analyze")
async def analyze_image(
    file: UploadFile = File(None),
    image_url: str = Form(None)
):
    """
    Analyze an image for text and DeepFake detection.
    You can either upload an image file or provide an image URL.
    """
    
    if not file and not image_url:
        raise HTTPException(status_code=400, detail="Please provide either an uploaded image or an image URL.")

    if file:
        try:
            contents = await file.read()
            image = Image.open(BytesIO(contents)).convert("RGB")
            source = file.filename
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file.")
    elif image_url:
        if not validators.url(image_url):
            raise HTTPException(status_code=400, detail="Invalid image URL.")
        image = load_image_from_url(image_url)
        source = image_url
    else:
        raise HTTPException(status_code=400, detail="No valid image source provided.")

    extracted_text = extract_text_from_image(image)
    classification = classify_image(image)

    # ✅ Return result in your requested format
    return JSONResponse(
        content={
            "source": source,
            "verdict": classification["verdict"],
            "confidence": round(classification["confidence"], 3),
            "extracted_text": extracted_text or "No text detected.",
        }
    )


# -------------------------------
# Root Endpoint
# -------------------------------
@app.get("/")
def root():
    return {
        "message": "🧠 Welcome to the Image Text & DeepFake Detector API",
        "usage": "Send POST request to /analyze with either 'file' or 'url'."
    }
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))