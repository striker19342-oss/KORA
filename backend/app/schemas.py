from pydantic import BaseModel, ConfigDict, Field
class PublicPlanRequest(BaseModel): requirement: str = Field(min_length=3, max_length=500)
class ProofPlan(BaseModel):
    summary: str; disclosures: list[str]; private_values: list[str]; request_hash: str; source: str; gemini_observes: str
class ProofReceiptCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    transaction_id: str = Field(min_length=8, max_length=160)
    outcome: bool
    disclosure_scope: str = Field(default='eligibility_only', pattern='^(eligibility_only)$')
class ProofReceiptResponse(ProofReceiptCreate): accepted: bool = True
