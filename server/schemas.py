from pydantic import BaseModel, Field
from typing import Optional


class RefineRequest(BaseModel):
    bullet_points: str = Field(..., min_length=1)
    tone: str = Field(..., pattern="^(firm|executive|empathetic|amazon_lp)$")
    session_id: Optional[str] = None


class SetApiKeyRequest(BaseModel):
    session_id: str
    api_key: str = Field(..., min_length=10)


class ApiKeyStatusResponse(BaseModel):
    active: bool
    session_id: str
    using_custom_key: bool


class ToneClassification(BaseModel):
    intent: str
    style_requirements: list[str]
    formality_level: str
    key_themes: list[str]


class DraftOutput(BaseModel):
    email: str
    summary: str
    slack_message: str


class SelfCritiqueResult(BaseModel):
    risk_score: int = Field(..., ge=0, le=100)
    tone_alignment: str
    reasoning: str
    suggestions: list[str]


class ReliabilityReport(BaseModel):
    risk_score: int
    tone_alignment: str
    reasoning: str
    suggestions: list[str]
    version: int
    was_refined: bool


class PipelineResponse(BaseModel):
    email: str
    summary: str
    slack_message: str
    reliability_report: ReliabilityReport
    pipeline_log: list[str]


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
