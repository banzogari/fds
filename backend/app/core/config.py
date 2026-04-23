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
    # .env에 값이 있으면 그걸 사용하고, 없으면 기본값 사용
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "FDS Prediction API")
    API_VERSION: str = os.getenv("API_VERSION", "1.0.0")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")

    # 3. DB 연결 정보
    # PostgreSQL 연결 문자열
    # 형식:
    # postgresql+psycopg2://username:password@host:port/dbname
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:1234@localhost:5432/fds_db"
    )

    # 4. 모델 / 예측 설정
    # threshold (확률 → label 변환 기준)
    # 예: 0.5 이상이면 fraud
    DEFAULT_THRESHOLD: float = float(
        os.getenv("DEFAULT_THRESHOLD", 0.5)
    )

    # 현재 예측 모드
    # mock: 테스트용
    # model: 실제 모델
    # ensemble: 여러 모델 결합
    MODEL_MODE: str = os.getenv("MODEL_MODE", "mock")

    # 5. 시뮬레이션 설정
    # dataset 기반 시뮬레이션용 CSV 경로
    SIMULATION_DATA_PATH: str = os.getenv(
        "SIMULATION_DATA_PATH",
        str(DATA_DIR / "sample.csv")
    )

    # 6. 모델 파일 경로 (추후 사용)
    # Random Forest 모델 경로
    RF_MODEL_PATH: str = os.getenv(
        "RF_MODEL_PATH",
        str(MODEL_DIR / "rf.pkl")
    )

    # XGBoost 모델 경로
    XGB_MODEL_PATH: str = os.getenv(
        "XGB_MODEL_PATH",
        str(MODEL_DIR / "xgb.pkl")
    )

    # 앙상블 설정 파일 경로 (가중치 등)
    ENSEMBLE_CONFIG_PATH: str = os.getenv(
        "ENSEMBLE_CONFIG_PATH",
        str(MODEL_DIR / "ensemble_config.json")
    )

    # 7. 모델 입력 feature 순서
    # dataset.csv column 순서와 동일
    FEATURE_ORDER = [
        "time",
        "v1",
        "v2",
        "v3",
        "v4",
        "v5",
        "v6",
        "v7",
        "v8",
        "v9",
        "v10",
        "v11",
        "v12",
        "v13",
        "v14",
        "v15",
        "v16",
        "v17",
        "v18",
        "v19",
        "v20",
        "v21",
        "v22",
        "v23",
        "v24",
        "v25",
        "v26",
        "v27",
        "v28",
        "amount",
    ]

    # 8. 유효성 검사 함수
    @classmethod
    def validate_threshold(cls) -> None:
        """
        threshold 값이 0~1 범위인지 검증
        잘못된 값이면 서버 시작 시 에러 발생
        """
        if not (0.0 <= cls.DEFAULT_THRESHOLD <= 1.0):
            raise ValueError("DEFAULT_THRESHOLD must be between 0.0 and 1.0")

    @classmethod
    def get_feature_count(cls) -> int:
        """
        모델 입력 feature 개수 반환
        → 디버깅, 검증용
        """
        return len(cls.FEATURE_ORDER)


# 설정 객체 생성
# 다른 파일에서 import 해서 사용
settings = Settings()

# 앱(백엔드 서버) 시작 시 검증 수행
# 잘못된 threshold 값이면 바로 에러 발생
settings.validate_threshold()