import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.party import Party
from app.schemas.party import PartyCreate, PartyUpdate, PartyRead

router = APIRouter(prefix="/parties", tags=["parties"])


@router.get("/", response_model=list[PartyRead])
def list_parties(db: Session = Depends(get_db)):
    return db.query(Party).all()


@router.post("/", response_model=PartyRead, status_code=201)
def create_party(payload: PartyCreate, db: Session = Depends(get_db)):
    party = Party(**payload.model_dump())
    db.add(party)
    db.commit()
    db.refresh(party)
    return party


@router.get("/{party_id}", response_model=PartyRead)
def get_party(party_id: uuid.UUID, db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


@router.put("/{party_id}", response_model=PartyRead)
def update_party(party_id: uuid.UUID, payload: PartyUpdate, db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(party, field, value)
    db.commit()
    db.refresh(party)
    return party


@router.delete("/{party_id}", status_code=204)
def delete_party(party_id: uuid.UUID, db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    db.delete(party)
    db.commit()