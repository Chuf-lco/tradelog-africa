import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin


class DocumentType(str, enum.Enum):
    """
    Core trade document types in East African corridors.
    BL = Bill of Lading (sea), AWB = Air Waybill.
    """
    bill_of_lading = "bill_of_lading"
    airway_bill = "airway_bill"
    commercial_invoice = "commercial_invoice"
    packing_list = "packing_list"
    certificate_of_origin = "certificate_of_origin"
    customs_entry = "customs_entry"  # IDF (Kenya) / BoE (Tanzania)
    phytosanitary = "phytosanitary"
    insurance_certificate = "insurance_certificate"
    other = "other"


class DocumentStatus(str, enum.Enum):
    uploaded = "uploaded"       # raw file, not yet parsed
    parsing = "parsing"         # W3: Claude API is extracting fields
    parsed = "parsed"           # fields extracted, ready to review
    verified = "verified"       # user confirmed extracted data
    rejected = "rejected"       # bad scan or wrong doc


class Document(UUIDMixin, TimestampMixin, Base):
    """
    A single trade document attached to a shipment.
    parsed_data (JSONB) is empty until W3 when the Claude API fills it.
    """

    __tablename__ = "documents"

    shipment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("shipments.id", ondelete="CASCADE"),
        nullable=False,
    )

    doc_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type"), nullable=False
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="document_status"),
        default=DocumentStatus.uploaded,
        nullable=False,
    )

    # Storage — local path for now, swap for S3 key in production
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(nullable=True)

    # W3: Claude API writes extracted fields here.
    # Schema varies by doc_type, so JSONB is the right call.
    # Example for a commercial_invoice:
    # {
    #   "invoice_number": "INV-2025-001",
    #   "invoice_date": "2025-03-01",
    #   "total_value": 12500.00,
    #   "currency": "USD",
    #   "line_items": [{"description": "...", "qty": 10, "unit_price": 1250}]
    # }
    parsed_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Who uploaded it
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    shipment: Mapped["Shipment"] = relationship(  # noqa: F821
        "Shipment", back_populates="documents"
    )

    def __repr__(self) -> str:
        return f"<Document {self.doc_type} [{self.status}] — {self.filename}>"