import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin


class ShipmentStatus(str, enum.Enum):
    draft = "draft"
    in_transit = "in_transit"
    at_customs = "at_customs"
    customs_cleared = "customs_cleared"
    delivered = "delivered"
    on_hold = "on_hold"  # customs query, missing docs, dispute


# Valid forward transitions — enforced in the router
STATUS_TRANSITIONS: dict[ShipmentStatus, set[ShipmentStatus]] = {
    ShipmentStatus.draft: {ShipmentStatus.in_transit},
    ShipmentStatus.in_transit: {ShipmentStatus.at_customs, ShipmentStatus.on_hold},
    ShipmentStatus.at_customs: {ShipmentStatus.customs_cleared, ShipmentStatus.on_hold},
    ShipmentStatus.customs_cleared: {ShipmentStatus.delivered},
    ShipmentStatus.on_hold: {
        ShipmentStatus.in_transit,
        ShipmentStatus.at_customs,
    },
    ShipmentStatus.delivered: set(),  # terminal state
}


class ShipmentDirection(str, enum.Enum):
    import_ = "import"
    export = "export"


class IncotermsCode(str, enum.Enum):
    """Common Incoterms used in East African trade."""
    EXW = "EXW"
    FOB = "FOB"
    CIF = "CIF"
    CFR = "CFR"
    DAP = "DAP"
    DDP = "DDP"


class Shipment(UUIDMixin, TimestampMixin, Base):
    """
    Core entity. Represents one import or export movement.
    Documents attach to this; parties link as shipper / consignee.
    """

    __tablename__ = "shipments"

    # Human-readable reference (e.g. "KE-2025-00142")
    ref_number: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)

    status: Mapped[ShipmentStatus] = mapped_column(
        Enum(ShipmentStatus, name="shipment_status"),
        default=ShipmentStatus.draft,
        nullable=False,
    )
    direction: Mapped[ShipmentDirection] = mapped_column(
        Enum(ShipmentDirection, name="shipment_direction"),
        nullable=False,
    )

    origin_country: Mapped[str] = mapped_column(String(60), nullable=False)
    origin_port: Mapped[str | None] = mapped_column(String(80), nullable=True)
    destination_country: Mapped[str] = mapped_column(String(60), nullable=False)
    destination_port: Mapped[str | None] = mapped_column(String(80), nullable=True)

    incoterms: Mapped[IncotermsCode | None] = mapped_column(
        Enum(IncotermsCode, name="incoterms_code"), nullable=True
    )

    # Cargo description
    commodity: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hs_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gross_weight_kg: Mapped[float | None] = mapped_column(nullable=True)
    volume_cbm: Mapped[float | None] = mapped_column(nullable=True)

    # Key dates
    etd: Mapped[date | None] = mapped_column(Date, nullable=True)  # estimated departure
    eta: Mapped[date | None] = mapped_column(Date, nullable=True)   # estimated arrival
    ata: Mapped[date | None] = mapped_column(Date, nullable=True)   # actual arrival

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Parties
    shipper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parties.id"), nullable=False
    )
    consignee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parties.id"), nullable=False
    )

    shipper: Mapped["Party"] = relationship(  # noqa: F821
        "Party",
        back_populates="shipments_as_shipper",
        foreign_keys=[shipper_id],
    )
    consignee: Mapped["Party"] = relationship(  # noqa: F821
        "Party",
        back_populates="shipments_as_consignee",
        foreign_keys=[consignee_id],
    )

    documents: Mapped[list["Document"]] = relationship(  # noqa: F821
        "Document",
        back_populates="shipment",
        cascade="all, delete-orphan",
    )

    def can_transition_to(self, new_status: ShipmentStatus) -> bool:
        """Check if a status transition is allowed."""
        return new_status in STATUS_TRANSITIONS[self.status]

    def __repr__(self) -> str:
        return f"<Shipment {self.ref_number} [{self.status}]>"