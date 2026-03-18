import uuid
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.party import PartyRole


class PartyBase(BaseModel):
    name: str
    role: PartyRole
    country: str
    tax_pin: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class PartyCreate(PartyBase):
    pass


class PartyUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[PartyRole] = None
    country: Optional[str] = None
    tax_pin: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class PartyRead(PartyBase):
    id: uuid.UUID

    model_config = {"from_attributes": True}