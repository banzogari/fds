# api/health.py

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
def health_check():
    """
    서버 상태 확인 엔드포인트

    역할:
    1. 서버 정상 실행 여부 확인
    2. config 로드 정상 여부 확인
    3. API 라우터 연결 확인
    """
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.API_VERSION,
        "model_mode": settings.MODEL_MODE,
    }