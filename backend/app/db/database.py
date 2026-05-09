from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# DB 엔진 생성
# config.py의 DATABASE_URL 사용
engine = create_engine(settings.DATABASE_URL)

# 세션 팩토리 생성
# autocommit=False : 명시적 commit 필요
# autoflush=False  : 명시적 flush 필요
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base 클래스 생성
# db/models.py에서 테이블 정의 시 상속
Base = declarative_base()