import uuid
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db import get_db
from app.models.shipment import Shipment
from app.models.document import Document, DocumentStatus
from app.schemas.document import DocumentCreate, DocumentRead, DocumentParsedUpdate
from app.services.parser import parse_document

router = APIRouter(prefix="/shipments/{shipment_id}/documents", tags=["documents"])


def _get_shipment_or_404(db: Session, shipment_id: uuid.UUID) -> Shipment:
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


def _get_doc_or_404(db: Session, shipment_id: uuid.UUID, doc_id: uuid.UUID) -> Document:
    doc = (
        db.query(Document)
        .filter(Document.shipment_id == shipment_id, Document.id == doc_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


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
    doc = Document(**payload.model_dump(exclude={"shipment_id"}), shipment_id=shipment_id)
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
    return _get_doc_or_404(db, shipment_id, doc_id)


@router.post("/{doc_id}/parse", response_model=dict)
def parse_doc(
    shipment_id: uuid.UUID,
    doc_id: uuid.UUID,
    document_text: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Send document text to Groq and return extracted fields for user review.
    Does NOT save to the database — the confirm endpoint does that.
    """
    doc = _get_doc_or_404(db, shipment_id, doc_id)
    doc.status = DocumentStatus.parsing
    db.commit()

    try:
        extracted = parse_document(doc.doc_type, document_text)
    except ValueError as e:
        doc.status = DocumentStatus.uploaded
        db.commit()
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        doc.status = DocumentStatus.uploaded
        db.commit()
        raise HTTPException(status_code=500, detail=f"Parser error: {str(e)}")

    return {
        "doc_id": str(doc_id),
        "doc_type": doc.doc_type,
        "extracted": extracted,
    }


@router.post("/{doc_id}/confirm", response_model=DocumentRead)
def confirm_parsed_data(
    shipment_id: uuid.UUID,
    doc_id: uuid.UUID,
    payload: DocumentParsedUpdate,
    db: Session = Depends(get_db),
):
    """User confirmed the extracted fields — save to DB and mark verified."""
    doc = _get_doc_or_404(db, shipment_id, doc_id)
    doc.parsed_data = payload.parsed_data
    doc.status = DocumentStatus.verified
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{doc_id}/reject", response_model=DocumentRead)
def reject_parsed_data(
    shipment_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """User rejected the extracted fields — reset to uploaded so they can retry."""
    doc = _get_doc_or_404(db, shipment_id, doc_id)
    doc.status = DocumentStatus.uploaded
    doc.parsed_data = None
    db.commit()
    db.refresh(doc)
    return doc


@router.patch("/{doc_id}/parsed", response_model=DocumentRead)
def update_parsed_data(
    shipment_id: uuid.UUID,
    doc_id: uuid.UUID,
    payload: DocumentParsedUpdate,
    db: Session = Depends(get_db),
):
    doc = _get_doc_or_404(db, shipment_id, doc_id)
    doc.parsed_data = payload.parsed_data
    doc.status = payload.status
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    shipment_id: uuid.UUID, doc_id: uuid.UUID, db: Session = Depends(get_db)
):
    doc = _get_doc_or_404(db, shipment_id, doc_id)
    db.delete(doc)
    db.commit()