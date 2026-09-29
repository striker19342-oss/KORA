from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from .config import settings
from .db import engine, get_session
from .gemini import compose_plan
from .models import Base, PublicReceipt
from .schemas import ProofPlan, ProofReceiptCreate, ProofReceiptResponse, PublicPlanRequest

@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn: await conn.run_sync(Base.metadata.create_all)
    yield
app = FastAPI(title='KORA public service', version='0.1.0', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings().allowed_origins, allow_credentials=False, allow_methods=['GET','POST'], allow_headers=['Content-Type'])
@app.get('/health')
async def health(response: Response):
    response.headers['Cache-Control'] = 'no-store'
    return {'status':'ok','service':'kora-public-api','version':app.version}
@app.get('/metrics')
async def metrics(response: Response, session: AsyncSession = Depends(get_session)):
    response.headers['Cache-Control'] = 'public, max-age=60, s-maxage=60'
    count = await session.scalar(select(func.count(PublicReceipt.id)))
    return {'public_auctions':1,'finalized_receipts':count or 0,'privacy_note':'Aggregate public metadata only.'}
@app.post('/gemini/proof-plan', response_model=ProofPlan)
async def proof_plan(request: PublicPlanRequest): return await compose_plan(request.requirement)
@app.post('/receipts', response_model=ProofReceiptResponse, status_code=201)
async def receipt(payload: ProofReceiptCreate, session: AsyncSession = Depends(get_session)):
    if await session.scalar(select(PublicReceipt).where(PublicReceipt.transaction_id == payload.transaction_id)): raise HTTPException(409, 'Receipt already stored.')
    session.add(PublicReceipt(**payload.model_dump())); await session.commit()
    return ProofReceiptResponse(**payload.model_dump())
