import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db import get_db
from app.models.shipment import Shipment
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentRead, DocumentParsedUpdate

router = APIRouter(prefix="/shipments/{shipment_id}/documents", tags=["documents"])


def _get_shipment_or_404(db: Session, shipment_id: uuid.UUID) -> Shipment:
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


@router.get("/", response_model=list[DocumentRead])
def list_documents(shipment_id: uuid.UUID, db: Session = Depends(get_db)):
    _get_shipment_or_404(db, shipment_id)
    return db.query(Document).filter(Document.shipment_id == shipment_id).all()


@router.post("/", response_model=DocumentRead, status_code=201)
def create_document(
    shipment_id: uuid.UUID,
    payload: DocumentCreate,
    db: Session = Depends(get_db),
):
    _get_shipment_or_404(db, shipment_id)
    doc = Document(**payload.model_dump(), shipment_id=shipment_id)
    db.add(doc)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=422, detail="Invalid reference — check shipment_id")
    db.refresh(doc)
    return doc


@router.get("/{doc_id}", response_model=DocumentRead)
def get_document(
    shipment_id: uuid.UUID, doc_id: uuid.UUID, db: Session = Depends(get_db)
):
    doc = (
        db.query(Document)
        .filter(Document.shipment_id == shipment_id, Document.id == doc_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.patch("/{doc_id}/parsed", response_model=DocumentRead)
def update_parsed_data(
    shipment_id: uuid.UUID,
    doc_id: uuid.UUID,
    payload: DocumentParsedUpdate,
    db: Session = Depends(get_db),
):
    """W3 endpoint — Claude API writes extracted fields here."""
    doc = (
        db.query(Document)
        .filter(Document.shipment_id == shipment_id, Document.id == doc_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.parsed_data = payload.parsed_data
    doc.status = payload.status
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    shipment_id: uuid.UUID, doc_id: uuid.UUID, db: Session = Depends(get_db)
):
    doc = (
        db.query(Document)
        .filter(Document.shipment_id == shipment_id, Document.id == doc_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()