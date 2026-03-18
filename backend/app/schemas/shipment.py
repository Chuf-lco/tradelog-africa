import uuid
from datetime import date
from pydantic import BaseModel, field_validator
from typing import Optional
from app.models.shipment import (
    ShipmentStatus,
    ShipmentDirection,
    IncotermsCode,
    STATUS_TRANSITIONS,
)


class ShipmentBase(BaseModel):
    ref_number: str
    direction: ShipmentDirection
    origin_country: str
    origin_port: Optional[str] = None
    destination_country: str
    destination_port: Optional[str] = None
    incoterms: Optional[IncotermsCode] = None
    commodity: Optional[str] = None
    hs_code: Optional[str] = None
    gross_weight_kg: Optional[float] = None
    volume_cbm: Optional[float] = None
    etd: Optional[date] = None
    eta: Optional[date] = None
    ata: Optional[date] = None
    notes: Optional[str] = None
    shipper_id: uuid.UUID
    consignee_id: uuid.UUID


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentStatusUpdate(BaseModel):
    """Used exclusively for PATCH /shipments/{id}/status."""
    status: ShipmentStatus

    @field_validator("status")
    @classmethod
    def status_must_be_valid_enum(cls, v: ShipmentStatus) -> ShipmentStatus:
        # Transition validity is checked in the router against the current
        # shipment status — we can't do that here without DB access.
        return v


class ShipmentUpdate(BaseModel):
    origin_port: Optional[str] = None
    destination_port: Optional[str] = None
    incoterms: Optional[IncotermsCode] = None
    commodity: Optional[str] = None
    hs_code: Optional[str] = None
    gross_weight_kg: Optional[float] = None
    volume_cbm: Optional[float] = None
    etd: Optional[date] = None
    eta: Optional[date] = None
    ata: Optional[date] = None
    notes: Optional[str] = None


class ShipmentRead(ShipmentBase):
    id: uuid.UUID
    status: ShipmentStatus
    allowed_next_statuses: list[ShipmentStatus] = []

    model_config = {"from_attributes": True}


from app.schemas.party import PartyRead


class ShipmentReadWithParties(ShipmentRead):
    """Extended read that includes party names — for the shipment detail view."""
    shipper: Optional[PartyRead] = None
    consignee: Optional[PartyRead] = None