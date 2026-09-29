from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.gemini import fallback, redact_public_text
client=TestClient(app)
client.__enter__()
def test_health(): assert client.get('/health').json()['status']=='ok'
def test_metrics(): assert 'public_auctions' in client.get('/metrics').json()
def test_redacts_seed(): assert '[REDACTED]' in redact_public_text('seed phrase abc')
def test_redacts_card_like_number(): assert '[REDACTED]' in redact_public_text('1234567890123456')
def test_redacts_wallet_address(): assert '[REDACTED]' in redact_public_text('0x1234567890abcdef1234567890abcdef12345678')
def test_plan_is_hashed(): assert len(fallback('reserve at least 5').request_hash)==64
def test_fallback_is_structured(): assert client.post('/gemini/proof-plan',json={'requirement':'reserve >= 5000'}).json()['source']=='deterministic_fallback'
def test_metrics_are_cacheable(): assert 'max-age=60' in client.get('/metrics').headers['cache-control']
def test_receipt_accepts_public_payload(): assert client.post('/receipts',json={'transaction_id':f'tx-{uuid4().hex}','outcome':True}).status_code==201
def test_receipt_rejects_extra_private_value(): assert client.post('/receipts',json={'transaction_id':'tx12345678','outcome':True,'bid':4}).status_code==422
