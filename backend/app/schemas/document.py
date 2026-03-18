import uuid
from pydantic import BaseModel
from typing import Optional, Any
from app.models.document import DocumentType, DocumentStatus


class DocumentBase(BaseModel):
    doc_type: DocumentType
    filename: str
    file_path: str
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None


class DocumentCreate(DocumentBase):
    shipment_id: uuid.UUID
    uploaded_by_id: Optional[uuid.UUID] = None


class DocumentRead(DocumentBase):
    id: uuid.UUID
    shipment_id: uuid.UUID
    status: DocumentStatus
    parsed_data: Optional[dict[str, Any]] = None
    uploaded_by_id: Optional[uuid.UUID] = None

    model_config = {"from_attributes": True}


class DocumentParsedUpdate(BaseModel):
    """Used in W3 when the Claude API writes extracted fields back."""
    parsed_data: dict[str, Any]
    status: DocumentStatus = DocumentStatus.parsed