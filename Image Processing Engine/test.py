# uvicorn Image_deepFake_combine:app --reload

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image, ImageOps
import torch
import cv2
import os
import json
import numpy as np
import requests
from io import BytesIO
from datetime import datetime
from transformers import AutoImageProcessor, AutoModelForImageClassification
import easyocr
import validators

# -------------------------------
# CONFIG
# -------------------------------
MODEL_NAME = "prithivMLmods/deepfake-detector-model-v1"
THRESHOLD_FAKE = 0.20
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = FastAPI(
    title="🧠 Image Text & DeepFake Detection API",
    description="API for OCR + DeepFake analysis from image files or URLs.",
    version="1.0.0"
)

# -------------------------------
# Load Models Once
# -------------------------------
print("Loading models...")
reader = easyocr.Reader(['en'], gpu=False)
processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME).to(DEVICE)
print("✅ Models loaded successfully.")

# -------------------------------
# Helper Functions
# -------------------------------
def load_image_from_url(url: str) -> Image.Image:
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    return Image.open(BytesIO(resp.content)).convert("RGB")

def detect_faces_np(img_np: np.ndarray, conf_thresh: float = 0.5):
    if not os.path.exists("deploy.prototxt") or not os.path.exists("res10_300x300_ssd_iter_140000.caffemodel"):
        return []
    net = cv2.dnn.readNetFromCaffe("deploy.prototxt", "res10_300x300_ssd_iter_140000.caffemodel")
    h, w = img_np.shape[:2]
    blob = cv2.dnn.blobFromImage(cv2.resize(img_np, (300,300)), 1.0, (300,300), (104.0,177.0,123.0))
    net.setInput(blob)
    detections = net.forward()
    boxes = []
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > conf_thresh:
            box = detections[0,0,i,3:7] * np.array([w, h, w, h])
            (x1, y1, x2, y2) = box.astype("int")
            boxes.append((x1, y1, x2, y2))
    return boxes

def classify_image(img: Image.Image):
    img_np = np.array(img)
    try:
        boxes = detect_faces_np(img_np)
    except Exception:
        boxes = []

    patches = [img.crop((x1, y1, x2, y2)) for (x1, y1, x2, y2) in boxes] if boxes else [img]
    all_results = []

    for patch in patches:
        inputs = processor(images=patch, return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=1).cpu().numpy().squeeze()
        id2label = model.config.id2label
        for idx, p in enumerate(probs):
            label = id2label[str(idx)] if str(idx) in id2label else id2label[idx]
            all_results.append((label, float(p)))

    for (label, score) in all_results:
        if "fake" in label.lower() and score > THRESHOLD_FAKE:
            return "Fake", score

    best_label, best_score = max(all_results, key=lambda x: x[1])
    return ("Real", best_score) if "real" in best_label.lower() else ("Fake", best_score)

def extract_text_from_image(image: Image.Image):
    gray_image = ImageOps.grayscale(image)
    gray_np = np.array(gray_image)
    result = reader.readtext(gray_np, detail=0)
    return "\n".join(result) if result else None

# -------------------------------
# API Endpoints
# -------------------------------
class ImageURLRequest(BaseModel):
    image_url: str

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Image Text & DeepFake Detection API. Use /analyze/url or /analyze/upload endpoints."
    }

@app.post("/analyze/url")
async def analyze_image_url(payload: ImageURLRequest):
    url = payload.image_url
    if not validators.url(url):
        raise HTTPException(status_code=400, detail="Invalid image URL.")
    try:
        image = load_image_from_url(url)
        extracted_text = extract_text_from_image(image)
        verdict, confidence = classify_image(image)
        record = {
            "timestamp": datetime.now().isoformat(),
            "image_source": url,
            "extracted_text": extracted_text if extracted_text else "No text found",
            "verdict": verdict,
            "confidence": round(confidence, 3)
        }
        return JSONResponse(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/upload")
async def analyze_uploaded_image(file: UploadFile = File(...)):
    try:
        image = Image.open(file.file).convert("RGB")
        extracted_text = extract_text_from_image(image)
        verdict, confidence = classify_image(image)
        record = {
            "timestamp": datetime.now().isoformat(),
            "image_source": file.filename,
            "extracted_text": extracted_text if extracted_text else "No text found",
            "verdict": verdict,
            "confidence": round(confidence, 3)
        }
        return JSONResponse(record)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
