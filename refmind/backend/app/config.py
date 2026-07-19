from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    watsonx_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("WATSONX_API_KEY", "WATSONX_APIKEY"),
    )
    watsonx_project_id: str = Field(
        default="",
        validation_alias=AliasChoices("WATSONX_PROJECT_ID", "PROJECT_ID"),
    )
    watsonx_url: str = Field(default="https://us-south.ml.cloud.ibm.com", validation_alias="WATSONX_URL")
    watsonx_model_id: str = Field(
        default="ibm/granite-3-8b-instruct", validation_alias="WATSONX_MODEL_ID"
    )
    demo_mode: bool = Field(default=True, validation_alias="DEMO_MODE")

    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_model_id: str = Field(
        default="gemini-2.0-flash",
        validation_alias="GEMINI_MODEL_ID",
    )

    chroma_persist_dir: str = "data/chroma"
    rules_pdf_dir: str = "data/rules"
    incidents_path: str = "app/data/incidents.json"

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    _PLACEHOLDERS = {"", "your_api_key_here", "your_project_id_here", "<YOUR_WATSONX_API_KEY_HERE>"}

    @property
    def watsonx_configured(self) -> bool:
        return (
            self.watsonx_api_key not in self._PLACEHOLDERS
            and self.watsonx_project_id not in self._PLACEHOLDERS
        )

    @property
    def granite_available(self) -> bool:
        return self.watsonx_configured and not self.demo_mode

    @property
    def gemini_configured(self) -> bool:
        return self.gemini_api_key not in self._PLACEHOLDERS

    @property
    def gemini_available(self) -> bool:
        return self.gemini_configured and not self.demo_mode


settings = Settings()
