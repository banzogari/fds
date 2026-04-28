import os
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드
# 프로젝트 루트 또는 backend 폴더에 있는 .env 파일을 읽어서 환경변수로 등록
# 목적 : DB 주소, threshold 등 민감 정보 관리용
load_dotenv()


class Settings:
    """
    애플리케이션 전역 설정 클래스

    역할:
    1. 환경변수 관리
    2. 모델/예측 관련 설정 관리
    3. 경로 관리
    4. feature 순서 고정 (매우 중요)
    """

    # 1. 프로젝트 경로 설정
    # 현재 파일 위치 기준으로 상위 폴더를 계산
    # config.py → core → app → backend
    BASE_DIR = Path(__file__).resolve().parent.parent.parent

    # backend/app 경로
    APP_DIR = BASE_DIR / "app"

    # 모델 파일 저장 경로 (추후 rf.pkl 등)
    MODEL_DIR = BASE_DIR / "models"

    # 데이터셋 경로 (simulate에서 사용)
    DATA_DIR = BASE_DIR / "data"

    # 2. 기본 API 정보
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "FDS Prediction API")
    API_VERSION: str = os.getenv("API_VERSION", "1.0.0")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")

    # 3. DB 연결 정보
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:1234@localhost:5432/fds_db"
    )

    # 4. 모델 / 예측 설정
    DEFAULT_THRESHOLD: float = float(
        os.getenv("DEFAULT_THRESHOLD", 0.5)
    )

    MODEL_MODE: str = os.getenv("MODEL_MODE", "mock")

    # 5. 시뮬레이션 설정
    SIMULATION_DATA_PATH: str = os.getenv(
        "SIMULATION_DATA_PATH",
        str(DATA_DIR / "sample.csv")
    )

    # 6. 모델 파일 경로 (추후 사용)
    RF_MODEL_PATH: str = os.getenv(
        "RF_MODEL_PATH",
        str(MODEL_DIR / "rf.pkl")
    )

    XGB_MODEL_PATH: str = os.getenv(
        "XGB_MODEL_PATH",
        str(MODEL_DIR / "xgb.pkl")
    )

    ENSEMBLE_CONFIG_PATH: str = os.getenv(
        "ENSEMBLE_CONFIG_PATH",
        str(MODEL_DIR / "ensemble_config.json")
    )

    # 7. 모델 입력 feature 순서
    # ⚠️ 실제 CSV 컬럼명 기준 (대소문자 일치 필수)
    # ⚠️ Class 컬럼은 label이므로 제외
    FEATURE_ORDER = [
        "Time",
        "V1", "V2", "V3", "V4", "V5", "V6", "V7",
        "V8", "V9", "V10", "V11", "V12", "V13", "V14",
        "V15", "V16", "V17", "V18", "V19", "V20", "V21",
        "V22", "V23", "V24", "V25", "V26", "V27", "V28",
        "Amount",
    ]

    # 8. 유효성 검사 함수
    @classmethod
    def validate_threshold(cls) -> None:
        if not (0.0 <= cls.DEFAULT_THRESHOLD <= 1.0):
            raise ValueError("DEFAULT_THRESHOLD must be between 0.0 and 1.0")

    @classmethod
    def get_feature_count(cls) -> int:
        return len(cls.FEATURE_ORDER)


# 설정 객체 생성
settings = Settings()

# 앱 시작 시 threshold 검증
settings.validate_threshold()