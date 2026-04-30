from fastapi import FastAPI
from app.core.config import settings
from app.api import health

# FastAPI 앱 인스턴스 생성
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
)

# 라우터 등록
# 현재 : health만 연결
# 추후: predict, simulate 순차 추가 예정
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(predict.router, prefix=settings.API_PREFIX)