import asyncio, hashlib, re
from google import genai
from .config import settings
from .schemas import ProofPlan
SENSITIVE = re.compile(r'(seed phrase|private key|wallet address|0x[a-f0-9]{40,}|\b\d{12,19}\b)', re.I)
def redact_public_text(text: str) -> str: return SENSITIVE.sub('[REDACTED]', text)
def fallback(requirement: str) -> ProofPlan:
    return ProofPlan(summary='Prove the public eligibility rule without revealing the bid.', disclosures=['eligibility outcome', 'one-time nullifier'], private_values=['bid amount', 'holder secret'], request_hash=hashlib.sha256(requirement.encode()).hexdigest(), source='deterministic_fallback', gemini_observes='redacted public policy text only')
async def compose_plan(requirement: str) -> ProofPlan:
    clean = redact_public_text(requirement); default = fallback(clean); key = settings().gemini_api_key
    if not key: return default
    try:
        client = genai.Client(api_key=key)
        response = await asyncio.wait_for(asyncio.to_thread(client.models.generate_content, model=settings().gemini_model, contents=f'Public policy only: {clean}', config={'response_mime_type':'application/json','response_schema':{'type':'OBJECT','properties':{'summary':{'type':'STRING'},'disclosures':{'type':'ARRAY','items':{'type':'STRING'}},'private_values':{'type':'ARRAY','items':{'type':'STRING'}}},'required':['summary','disclosures','private_values']}}), timeout=12)
        parsed = ProofPlan.model_validate_json(response.text)
        return parsed.model_copy(update={'request_hash':default.request_hash,'source':'gemini','gemini_observes':'redacted public policy text only'})
    except Exception: return default
