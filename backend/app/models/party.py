import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin


class PartyRole(str, enum.Enum):
    importer = "importer"
    exporter = "exporter"
    agent = "agent"
    customs_broker = "customs_broker"
    freight_forwarder = "freight_forwarder"


class Party(UUIDMixin, TimestampMixin, Base):
    """
    A business or individual involved in a shipment.
    One party can appear as shipper or consignee on many shipments.
    """

    __tablename__ = "parties"

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[PartyRole] = mapped_column(
        Enum(PartyRole, name="party_role"), nullable=False
    )

    # East African context: KRA PIN (Kenya), TIN (Tanzania/Uganda/Rwanda)
    tax_pin: Mapped[str | None] = mapped_column(String(40), nullable=True)

    country: Mapped[str] = mapped_column(String(60), nullable=False)
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # Relationships — a party can be shipper or consignee on many shipments
    shipments_as_shipper: Mapped[list["Shipment"]] = relationship(  # noqa: F821
        "Shipment",
        back_populates="shipper",
        foreign_keys="Shipment.shipper_id",
    )
    shipments_as_consignee: Mapped[list["Shipment"]] = relationship(  # noqa: F821
        "Shipment",
        back_populates="consignee",
        foreign_keys="Shipment.consignee_id",
    )

    def __repr__(self) -> str:
        return f"<Party {self.name} ({self.role}) — {self.country}>"