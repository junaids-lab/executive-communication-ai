import json
import os
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception
from server.schemas import (
    ToneClassification,
    DraftOutput,
    SelfCritiqueResult,
    ReliabilityReport,
    PipelineResponse,
)

# the newest OpenAI model is "gpt-5" which was released August 7, 2025.
# do not change this unless explicitly requested by the user
MODEL = "gpt-5"
RISK_THRESHOLD = 60

openai_client = OpenAI(
    api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY"),
    base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
)


def is_retryable_error(exception: BaseException) -> bool:
    error_msg = str(exception)
    if (
        "429" in error_msg
        or "RATELIMIT_EXCEEDED" in error_msg
        or "quota" in error_msg.lower()
        or "rate limit" in error_msg.lower()
        or (hasattr(exception, "status_code") and exception.status_code == 429)
    ):
        return True
    if (
        "500" in error_msg
        or "502" in error_msg
        or "503" in error_msg
        or "timeout" in error_msg.lower()
        or isinstance(exception, (json.JSONDecodeError, KeyError, TypeError))
    ):
        return True
    return False


class LLMParseError(Exception):
    pass


def get_default_client() -> OpenAI:
    return openai_client


def make_custom_client(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key)


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=64),
    retry=retry_if_exception(is_retryable_error),
    reraise=True,
)
def call_llm(system_prompt: str, user_prompt: str, client: OpenAI | None = None) -> str:
    active_client = client or openai_client
    response = active_client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        max_completion_tokens=8192,
    )
    raw = response.choices[0].message.content or "{}"
    try:
        json.loads(raw)
    except json.JSONDecodeError as e:
        raise LLMParseError(f"LLM returned invalid JSON: {e}. Raw: {raw[:200]}") from e
    return raw


TONE_DESCRIPTIONS = {
    "firm": "Direct, assertive, no-nonsense. Clear boundaries and expectations.",
    "executive": "Strategic, concise, high-level. Suitable for C-suite communication.",
    "empathetic": "Understanding, supportive, warm. Acknowledges feelings while being professional.",
    "amazon_lp": "Grounded in Amazon Leadership Principles: Customer Obsession, Ownership, Bias for Action, Earn Trust, Dive Deep, etc.",
}


def step1_classify_tone(bullet_points: str, tone: str, log: list[str], client: OpenAI | None = None) -> ToneClassification:
    log.append("[Step 1] Classifying tone and intent...")
    system_prompt = """You are a communication analyst. Analyze the user's bullet points and classify the intent and style requirements.

Return JSON matching this exact schema:
{
  "intent": "string describing the core intent",
  "style_requirements": ["list", "of", "style", "requirements"],
  "formality_level": "one of: formal, semi-formal, casual",
  "key_themes": ["list", "of", "key", "themes"]
}"""
    user_prompt = f"""Bullet points:
{bullet_points}

Requested tone: {tone} - {TONE_DESCRIPTIONS.get(tone, '')}

Analyze the intent and style requirements for these bullet points given the requested tone."""

    raw = call_llm(system_prompt, user_prompt, client)
    parsed = json.loads(raw)
    result = ToneClassification(**parsed)
    log.append(f"[Step 1] Intent: {result.intent}")
    log.append(f"[Step 1] Formality: {result.formality_level}")
    log.append(f"[Step 1] Themes: {', '.join(result.key_themes)}")
    return result


def step2_draft(
    bullet_points: str, tone: str, classification: ToneClassification, log: list[str], client: OpenAI | None = None
) -> DraftOutput:
    log.append("[Step 2] Generating drafts (Email, Summary, Slack)...")
    system_prompt = f"""You are an expert executive communication writer. Generate three versions of a professional message.

The tone is: {tone} - {TONE_DESCRIPTIONS.get(tone, '')}

Intent: {classification.intent}
Style requirements: {', '.join(classification.style_requirements)}
Formality level: {classification.formality_level}
Key themes: {', '.join(classification.key_themes)}

Return JSON matching this exact schema:
{{
  "email": "A complete, polished professional email with subject line, greeting, body paragraphs, and sign-off",
  "summary": "A concise 2-3 sentence executive summary",
  "slack_message": "A casual but professional Slack message, can use basic formatting like bold and bullet points"
}}"""

    user_prompt = f"Transform these bullet points into the three formats:\n\n{bullet_points}"
    raw = call_llm(system_prompt, user_prompt, client)
    parsed = json.loads(raw)
    result = DraftOutput(**parsed)
    log.append(f"[Step 2] Email draft: {len(result.email)} chars")
    log.append(f"[Step 2] Summary draft: {len(result.summary)} chars")
    log.append(f"[Step 2] Slack draft: {len(result.slack_message)} chars")
    return result


def step3_critique(
    draft: DraftOutput, tone: str, classification: ToneClassification, log: list[str], client: OpenAI | None = None
) -> SelfCritiqueResult:
    log.append("[Step 3] Running self-critique analysis...")
    system_prompt = f"""You are a communication quality analyst performing a critical review. Evaluate the drafts for:

1. Risk of Misinterpretation (0-100 score, where 0 = no risk, 100 = very high risk)
2. Alignment with the requested tone: {tone} - {TONE_DESCRIPTIONS.get(tone, '')}
3. Original intent: {classification.intent}

Be rigorous. Look for ambiguity, passive-aggressive language, unclear action items, tone mismatch, or anything that could be misread.

Return JSON matching this exact schema:
{{
  "risk_score": 0-100 integer,
  "tone_alignment": "string assessment of how well the drafts match the tone",
  "reasoning": "detailed explanation of the analysis, covering specific phrases or patterns that contribute to risk",
  "suggestions": ["list", "of", "specific", "improvement", "suggestions"]
}}"""

    user_prompt = f"""Review these three communication drafts:

EMAIL:
{draft.email}

SUMMARY:
{draft.summary}

SLACK MESSAGE:
{draft.slack_message}"""

    raw = call_llm(system_prompt, user_prompt, client)
    parsed = json.loads(raw)
    result = SelfCritiqueResult(**parsed)
    log.append(f"[Step 3] Risk Score: {result.risk_score}/100")
    log.append(f"[Step 3] Tone Alignment: {result.tone_alignment}")
    log.append(f"[Step 3] Reasoning: {result.reasoning}")
    if result.suggestions:
        log.append(f"[Step 3] Suggestions: {'; '.join(result.suggestions)}")
    return result


def step4_refine(
    bullet_points: str,
    tone: str,
    classification: ToneClassification,
    original_draft: DraftOutput,
    critique: SelfCritiqueResult,
    log: list[str],
    client: OpenAI | None = None,
) -> DraftOutput:
    log.append(f"[Step 4] Risk score {critique.risk_score} exceeds threshold {RISK_THRESHOLD}. Refining...")
    system_prompt = f"""You are an expert executive communication writer performing a revision. The original drafts received critique that must be addressed.

The tone is: {tone} - {TONE_DESCRIPTIONS.get(tone, '')}
Intent: {classification.intent}

CRITIQUE TO ADDRESS:
- Risk Score: {critique.risk_score}/100
- Tone Alignment: {critique.tone_alignment}
- Reasoning: {critique.reasoning}
- Suggestions: {'; '.join(critique.suggestions)}

Revise all three formats to reduce the risk of misinterpretation while maintaining the intended tone and message.

Return JSON matching this exact schema:
{{
  "email": "Revised polished professional email",
  "summary": "Revised concise executive summary",
  "slack_message": "Revised Slack message"
}}"""

    user_prompt = f"""Original bullet points:
{bullet_points}

Original drafts to revise:

EMAIL:
{original_draft.email}

SUMMARY:
{original_draft.summary}

SLACK:
{original_draft.slack_message}"""

    raw = call_llm(system_prompt, user_prompt, client)
    parsed = json.loads(raw)
    result = DraftOutput(**parsed)
    log.append("[Step 4] Refinement complete.")
    return result


def run_pipeline(bullet_points: str, tone: str, client: OpenAI | None = None) -> PipelineResponse:
    log: list[str] = []
    log.append(f"Pipeline started. Tone: {tone}")
    if client:
        log.append("[Config] Using custom OpenAI API key")
    else:
        log.append("[Config] Using default AI integration")

    classification = step1_classify_tone(bullet_points, tone, log, client)

    draft = step2_draft(bullet_points, tone, classification, log, client)

    critique = step3_critique(draft, tone, classification, log, client)

    was_refined = False
    version = 1

    if critique.risk_score > RISK_THRESHOLD:
        draft = step4_refine(bullet_points, tone, classification, draft, critique, log, client)
        was_refined = True
        version = 2

        critique2 = step3_critique(draft, tone, classification, log, client)
        log.append(f"[Step 4] Refined risk score: {critique2.risk_score}/100 (was {critique.risk_score})")
        critique = critique2
    else:
        log.append(f"[Step 3] Risk score {critique.risk_score} is below threshold {RISK_THRESHOLD}. No refinement needed.")

    report = ReliabilityReport(
        risk_score=critique.risk_score,
        tone_alignment=critique.tone_alignment,
        reasoning=critique.reasoning,
        suggestions=critique.suggestions,
        version=version,
        was_refined=was_refined,
    )

    log.append("Pipeline complete.")

    return PipelineResponse(
        email=draft.email,
        summary=draft.summary,
        slack_message=draft.slack_message,
        reliability_report=report,
        pipeline_log=log,
    )
