# Executive Communication AI

A professional communication refiner powered by a multi-step AI reliability pipeline. Paste rough bullet points, choose a tone, and get polished drafts for Email, Executive Summary, and Slack — complete with an AI self-critique report that scores your message's risk of misinterpretation.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--5-412991)

---

## About

Executive Communication AI turns rough ideas into polished professional messages. Instead of relying on a single LLM call, it uses a **4-step agentic reasoning pipeline** with built-in self-correction:

1. **Tone Classification** — Analyzes your bullet points and categorizes intent, formality level, style requirements, and key themes.
2. **Drafting** — Generates three communication formats (Email, Summary, Slack) tailored to the classified tone.
3. **Self-Critique** — A second LLM pass evaluates the drafts for risk of misinterpretation (scored 0–100) and checks alignment with the chosen tone.
4. **Auto-Refinement** — If the risk score exceeds a threshold (60), the pipeline automatically regenerates improved drafts and re-evaluates them.

**Supported Tones:**
- **Firm** — Direct, assertive, clear boundaries
- **Executive** — Strategic, concise, C-suite ready
- **Empathetic** — Supportive, warm, understanding
- **Amazon Leadership Principles** — Grounded in Ownership, Bias for Action, Earn Trust, etc.

Users can optionally bring their own OpenAI API key (session-scoped, auto-expires after 24 hours, stored in memory only).

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- An OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/executive-communication-ai.git
cd executive-communication-ai

# Install Python dependencies
pip install fastapi uvicorn openai pydantic tenacity

# Install frontend dependencies
npm install

# Build the frontend
npm run build
```

### Configuration

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

Then update `server/pipeline.py` to use your key:

```python
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
```

Or simply use the built-in "Bring Your Own Key" feature in the UI — no code changes needed.

### Running

```bash
python main.py
```

The application will be available at `http://localhost:5000`.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite, Tailwind CSS 4 | Single-page dashboard with tabbed output display |
| **Backend** | Python, FastAPI, Uvicorn | REST API serving the AI pipeline and static frontend |
| **AI** | OpenAI API (GPT-5) | Multi-step structured output generation |
| **Validation** | Pydantic | Strict JSON schema enforcement on all LLM responses |
| **Reliability** | Tenacity | Retry logic with exponential backoff for API calls |

### Project Structure

```
main.py                          # Entry point — runs Uvicorn on port 5000
server/
  app.py                         # FastAPI app, CORS, API routes, static file serving
  schemas.py                     # Pydantic models for request/response validation
  pipeline.py                    # 4-step AI reliability pipeline
  session_keys.py                # In-memory session-scoped API key store (24h TTL)
client/
  index.html                     # HTML entry point
  vite.config.js                 # Vite config with Tailwind and API proxy
  src/
    App.jsx                      # Main app component with abort support
    components/
      InputForm.jsx              # Bullet points textarea + tone dropdown + stop button
      OutputDashboard.jsx        # Tabbed output (Email / Summary / Slack) with copy
      ReliabilityReport.jsx      # Risk score gauge + tone analysis card
      PipelineLog.jsx            # Expandable AI inner monologue log
      ApiKeySettings.jsx         # Bring-your-own-key panel
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/refine` | Run the full pipeline (`{bullet_points, tone, session_id?}`) |
| `POST` | `/api/keys/set` | Store a custom OpenAI API key for a session |
| `GET` | `/api/keys/status/:id` | Check if a custom key is active |
| `DELETE` | `/api/keys/:id` | Remove a custom key |
| `GET` | `/api/health` | Health check |

---

## What You Can Learn (AI / LLM Context)

This project demonstrates several important patterns for building reliable AI-powered applications:

### 1. Agentic Multi-Step Pipelines
Rather than sending a single prompt and hoping for the best, the pipeline breaks the task into discrete steps (classify, draft, critique, refine). Each step has a focused responsibility, making outputs more predictable and debuggable.

### 2. Structured Output Validation
Every LLM response is constrained to a JSON schema and validated through Pydantic models. This eliminates the common problem of unpredictable free-text responses and ensures deterministic formatting that downstream code can rely on.

### 3. Self-Critique and Reflection Loops
The pipeline includes a second LLM pass that acts as a critic — evaluating the first draft for risks and tone alignment. This "LLM-as-judge" pattern is a core technique in production AI systems for improving output quality without human review.

### 4. Automatic Refinement with Guardrails
When the self-critique identifies a high risk score, the system automatically triggers a refinement cycle. This threshold-based retry pattern demonstrates how to build self-correcting AI workflows.

### 5. Prompt Engineering for Reliability
Each step uses carefully structured system prompts with explicit JSON schemas, clear role definitions, and specific evaluation criteria. The prompts are designed to minimize ambiguity and maximize consistency.

### 6. Error Handling for Non-Deterministic Systems
LLM calls can fail in ways traditional APIs don't — malformed JSON, rate limits, timeout. The retry logic with exponential backoff and the JSON pre-validation layer show how to build resilience around inherently unreliable components.

### 7. Transparency via Inner Monologue
The pipeline logs every step's reasoning, scores, and decisions. This "show your work" approach is essential for trust in AI systems and makes it possible to debug why the AI made specific choices.

---

## Contributing

Contributions are welcome! Here are some ideas:

- Add new tone presets (e.g., Diplomatic, Technical, Casual Friday)
- Implement response streaming for real-time pipeline progress
- Add a comparison view to show Version 1 vs. Version 2 side by side
- Build a history feature to save and revisit past refinements
- Add support for additional LLM providers (Anthropic, Google, etc.)

To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).
