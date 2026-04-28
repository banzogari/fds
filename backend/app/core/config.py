import os
from pathlib import Path
from dotenv import load_dotenv

# 1. .env 파일 로드 (경로 명시 → 안정성 확보)
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = _BASE_DIR / ".env"

load_dotenv(ENV_PATH)

class Settings:
    """
    애플리케이션 전역 설정 클래스

    역할:
    1. 환경변수 관리
    2. 모델/예측 정책 관리
    3. 경로 관리
    4. 모델 입력 feature 순서 고정
    5. 설정값 검증 (fail-fast)
    """

    # 2. 프로젝트 경로 설정
    BASE_DIR = _BASE_DIR          # 외부 변수 참조 (중복 선언 제거)
    APP_DIR = _BASE_DIR / "app"
    MODEL_DIR = _BASE_DIR / "models"
    DATA_DIR = _BASE_DIR / "data"

    # 3. API 기본 정보
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "FDS Prediction API")
    API_VERSION: str = os.getenv("API_VERSION", "1.0.0")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")

    # 4. DB 연결 정보
    # DB 미구현 상태 → 임시 기본값 유지
    # DB 구현 시점에 .env로 주입 + validate_database() 활성화
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:1234@localhost:5432/fds_db"
    )

    # 5. 모델 / 예측 설정
    try:
        DEFAULT_THRESHOLD: float = float(
            os.getenv("DEFAULT_THRESHOLD", 0.5)
        )
    except ValueError:
        raise ValueError("DEFAULT_THRESHOLD must be a valid float")

    MODEL_MODE: str = os.getenv("MODEL_MODE", "mock")
    VALID_MODEL_MODES = {"mock", "model", "ensemble"}

    # 6. 시뮬레이션 설정
    SIMULATION_DATA_PATH: str = os.getenv(
        "SIMULATION_DATA_PATH",
        str(_BASE_DIR / "data" / "sample.csv")
    )

    # 7. 모델 파일 경로
    RF_MODEL_PATH: str = os.getenv(
        "RF_MODEL_PATH",
        str(_BASE_DIR / "models" / "rf.pkl")
    )

    XGB_MODEL_PATH: str = os.getenv(
        "XGB_MODEL_PATH",
        str(_BASE_DIR / "models" / "xgb.pkl")
    )

    ENSEMBLE_CONFIG_PATH: str = os.getenv(
        "ENSEMBLE_CONFIG_PATH",
        str(_BASE_DIR / "models" / "ensemble_config.json")
    )

    # 8. FEATURE ORDER 
    # ⚠️ 실제 CSV 컬럼명 기준 
    # ⚠️ Class 컬럼은 label이므로 제외
    # ⚠️ 모델 재학습 없이 수정 금지
    FEATURE_ORDER = [
        "Time",
        "V1",  "V2",  "V3",  "V4",  "V5",  "V6",  "V7",
        "V8",  "V9",  "V10", "V11", "V12", "V13", "V14",
        "V15", "V16", "V17", "V18", "V19", "V20", "V21",
        "V22", "V23", "V24", "V25", "V26", "V27", "V28",
        "Amount",
    ]

    EXPECTED_FEATURE_COUNT = 30

    # 9. 유효성 검사 (Fail-Fast)
    @classmethod
    def validate_threshold(cls) -> None:
        if not (0.0 <= cls.DEFAULT_THRESHOLD <= 1.0):
            raise ValueError("DEFAULT_THRESHOLD must be between 0.0 and 1.0")

    @classmethod
    def validate_model_mode(cls) -> None:
        if cls.MODEL_MODE not in cls.VALID_MODEL_MODES:
            raise ValueError(
                f"MODEL_MODE must be one of {cls.VALID_MODEL_MODES}"
            )

    @classmethod
    def validate_feature_order(cls) -> None:
        if len(cls.FEATURE_ORDER) != cls.EXPECTED_FEATURE_COUNT:
            raise ValueError(
                f"FEATURE_ORDER must have {cls.EXPECTED_FEATURE_COUNT} features"
            )

    @classmethod
    def validate_database(cls) -> None:
        """DB 구현 시점에 validate_all()에서 활성화"""
        if not cls.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set in environment variables")

    @classmethod
    def validate_paths(cls) -> None:
        """필요 시 활성화"""
        if not Path(cls.SIMULATION_DATA_PATH).exists():
            raise FileNotFoundError(
                f"Simulation data file not found: {cls.SIMULATION_DATA_PATH}"
            )

    @classmethod
    def validate_all(cls) -> None:
        cls.validate_threshold()
        cls.validate_model_mode()
        cls.validate_feature_order()
        # cls.validate_database()  # DB 구현 시 활성화
        # cls.validate_paths()     # 필요 시 활성화

    @classmethod
    def get_feature_count(cls) -> int:
        return len(cls.FEATURE_ORDER)


# 10. 설정 객체 생성 및 검증 실행
settings = Settings()
settings.validate_all()