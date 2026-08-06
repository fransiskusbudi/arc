import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.job_extract import FIELD_MAX_LEN, derive_source, parse_job_html, truncate
from app.models import User
from app.schemas import ImportLinkRequest, ImportLinkResponse

router = APIRouter(prefix="/import", tags=["import"])

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
_EXTRACT_FAILED = HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail="Could not extract job details from this URL",
)


def _build_http_client() -> httpx.Client:
    return httpx.Client(follow_redirects=True, timeout=8.0, headers={"User-Agent": _USER_AGENT})


def _fetch_html(url: str) -> str:
    try:
        with _build_http_client() as client:
            response = client.get(url)
            response.raise_for_status()
            return response.text
    except httpx.HTTPError as exc:
        raise _EXTRACT_FAILED from exc


@router.post("/link", response_model=ImportLinkResponse)
def import_link(
    payload: ImportLinkRequest, current_user: User = Depends(get_current_user)
) -> ImportLinkResponse:
    source = derive_source(payload.url)

    if payload.extracted is not None:
        extracted = payload.extracted.model_dump()
    else:
        html = _fetch_html(payload.url)
        extracted = parse_job_html(html)
        if extracted is None:
            raise _EXTRACT_FAILED

    return ImportLinkResponse(
        company=truncate(extracted.get("company"), FIELD_MAX_LEN),
        role=truncate(extracted.get("role"), FIELD_MAX_LEN),
        location=truncate(extracted.get("location"), FIELD_MAX_LEN),
        salary=truncate(extracted.get("salary"), FIELD_MAX_LEN),
        description=truncate(extracted.get("description"), 2000),
        source=source,
        url=payload.url,
    )
