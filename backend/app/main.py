from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.api import health, predict, simulate
from app.db.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 실행
    # DB에 테이블이 없으면 자동 생성
    Base.metadata.create_all(bind=engine)
    yield
    # 서버 종료 시 실행


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    lifespan=lifespan,
)

# 라우터 등록
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(predict.router, prefix=settings.API_PREFIX)
app.include_router(simulate.router, prefix=settings.API_PREFIX)