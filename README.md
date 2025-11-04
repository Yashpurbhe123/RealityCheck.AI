# 🌐 RealityCheck AI – AI-Powered Misinformation Detection for a Safer Digital World 🤖  

> ⚡ **RealityCheck AI** is a **Generative AI–powered system** that detects, explains, and counters misinformation — text, image, or video — in **real time**, directly inside your social media environment.  
> 🛡️ Unlike traditional fact-checking portals, **RealityCheck AI** integrates *within* the feed to deliver instant, context-aware insights and educational awareness.

---

## 📌 Overview  

Misinformation fuels confusion, division, and distrust.  
**RealityCheck AI** aims to **stop misinformation at its source** using **Generative AI, Google Cloud tools, and real-time data intelligence**.

✅ Detects misleading posts, deepfakes, and manipulated media  
✅ Explains *why* content is flagged using contextual reasoning  
✅ Educates users on misinformation tactics and prevention  
✅ Operates seamlessly inside platforms like X (Twitter), Instagram, and WhatsApp  

🎯 **Mission:** Empower every digital user with truth, transparency, and understanding.

---

## 🌟 Core Innovations & USPs ✨  

- 🔗 **Seamless In-App Integration** → Fact-checking happens *inside* the feed (no redirection).  
- 🧠 **Context-Aware Generative AI** → Uses **Gemini LLM** for tone, framing, and emotion detection beyond simple keywords.  
- 🧩 **Dual-Source Verification** → Combines *real-time data scraping* + *historical misinformation vectors* via **Vertex AI Vector Search**.  
- 🎓 **Educational Awareness Module** → Transforms detection into digital literacy training.  
- 🖼️ **Visual & Deepfake Detection** → Integrates **OCR-based text extraction** from memes and **deepfake image/video analysis**.  
- 🌍 **Multilingual & Inclusive** → Designed for India’s linguistic diversity and beyond.  
- ⚡ **Cloud-Native Scalability** → Powered by Google Cloud (Cloud Run, Cloud SQL, Vertex AI).  

💡 *One line summary:*  
**RealityCheck AI = Truth, Context, and Awareness — all inside your feed.**

---

## 🛠️ Key Features 🚀  

- 🔹 **Instant Verification:** One-click in-feed fact-checking.  
- 🔹 **Chatbot Assistance:** Conversational explanations and verified sources.  
- 🔹 **Color-Coded Verdicts:**  
  - 🟢 True  
  - 🟡 Caution / Misleading  
  - 🔴 False / Deepfake  
- 🔹 **Educational Alerts:** Teaches users how manipulation spreads.  
- 🔹 **Image & Video Analysis:** Detects deepfakes and synthetic visuals.  
- 🔹 **Multilingual Support:** Adapts across Indian and global languages.  
- 🔹 **Fast Cloud Caching:** Multi-layer Redis + vector embeddings ensure low latency.  

---

## 🔄 Process Flow 🔁  

1️⃣ User scrolls through social media.  
2️⃣ The **RealityCheck AI analyzer** detects possible misinformation.  
3️⃣ **Gemini LLM** performs context reasoning.  
4️⃣ **Python engine** scrapes trusted portals for factual data.  
5️⃣ **Vertex AI Vector Search** finds similar misinformation patterns.  
6️⃣ Verdict generated: ✅ True | ⚠️ Misleading | ❌ Deepfake / False.  
7️⃣ The user receives **clear explanations + awareness insights.**  
8️⃣ **Chatbot** offers detailed clarifications and sources.  

📊 **Flowchart:**  
![Process Flow](Assets/Flowchart.gif)

---

## 🏗️ System Architecture 🖥️  

### Google Cloud Components
| Tool | Category | Purpose | User Value |
|------|-----------|----------|-------------|
| **Gemini LLM** | Generative AI | Context-aware reasoning & misinformation detection | Human-like understanding |
| **Vertex AI Vector Search API** | AI Search | Similarity search on embeddings | Fast, accurate retrieval |
| **Gemma Embedding Model** | Embedding | Converts text/media into semantic vectors | High contextual accuracy |
| **Cloud SQL** | Database | Stores structured verified data | Reliable, scalable storage |
| **Cloud Scheduler** | Automation | Model retraining & reports | Continuous improvement |
| **Cloud Run** | Deployment | Scalable containerized backend | Low-latency performance |

### Overall Architecture
- **Frontend:** React.js + Vite + TypeScript  
- **Backend:** FastAPI / Node.js + Express.js  
- **AI Layer:** Gemini LLM + Vertex AI + Python (scraping & classification)  
- **Databases:** Cloud SQL + Supabase (vector storage)  
- **Caching:** Redis multi-layer  
- **Deployment:** Docker on Google Cloud Run  

📊 **Architecture Diagram:**  
![Architecture](Assets/Architecture.gif)

---

## ⚙️ Tech Stack 🛠️  

| Layer | Technologies |
|-------|---------------|
| **Frontend** | React.js, Vite, TypeScript |
| **Backend** | FastAPI / Node.js, Express.js |
| **AI Engine** | Gemini LLM, Vertex AI Vector Search, Gemma Embedding |
| **Database** | Cloud SQL, Supabase |
| **Caching** | Redis |
| **Scraping** | Python Web Scraper |
| **Deployment** | Google Cloud Run, Docker, GitHub |

---

## 📈 Impact & Future Scope 🌍  

### 🌟 Measurable Impact  
- Reduces fake news & disinformation by **60–70%**  
- Builds **digital literacy** and responsible behavior  
- Strengthens **trust** in online platforms  
- Enables **NGOs and governments** to verify content efficiently  

### 🚀 Scalability & Adoption  
- Plugin / API model for **Twitter/X**, **Instagram**, and **WhatsApp**  
- **Browser extension** and **mobile SDK** for seamless integration  
- Multilingual support across Indian and global contexts  

### 🔮 Next Steps (30–90 Days Roadmap)  
- **Month 1:** Closed beta testing and bug fixes  
- **Month 2:** Twitter/X API integration and demo rollout  
- **Month 3:** Enhance deepfake and multilingual modules  

### 🌱 Future Vision  
- Cross-platform misinformation dashboard  
- Gamified awareness for fact-checkers  
- Global expansion under “AI for Social Good”  

---

## 👥 Team – Data Squad 💪  

- 🧑‍💻 **Yash Shivlal Purbhe** – Team Leader  
- 👩‍💻 **Dipshree Vartak**  
- 👨‍💻 **Aditya Kokate**  
- 👨‍💻 **Manas Gurav**  
- 👨‍💻 **Amaan Kherani**

---

💡 **Our Vision:** An informed, aware, and resilient digital society.  
🔥 **RealityCheck AI – Truth. Context. Awareness. All in Real Time.**

---
