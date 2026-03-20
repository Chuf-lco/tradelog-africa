import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db import get_db
from app.models.shipment import Shipment, ShipmentStatus, STATUS_TRANSITIONS
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentStatusUpdate,
    ShipmentRead,
    ShipmentReadWithParties,
)

router = APIRouter(prefix="/shipments", tags=["shipments"])


def _get_or_404(db: Session, shipment_id: uuid.UUID) -> Shipment:
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


def _to_read(shipment: Shipment) -> ShipmentRead:
    """Attach allowed_next_statuses before returning."""
    data = ShipmentRead.model_validate(shipment)
    data.allowed_next_statuses = list(STATUS_TRANSITIONS[shipment.status])
    return data


@router.get("/", response_model=list[ShipmentRead])
def list_shipments(
    status: ShipmentStatus | None = Query(default=None),
    direction: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(Shipment)
    if status:
        q = q.filter(Shipment.status == status)
    if direction:
        q = q.filter(Shipment.direction == direction)
    return [_to_read(s) for s in q.all()]


@router.post("/", response_model=ShipmentRead, status_code=201)
def create_shipment(payload: ShipmentCreate, db: Session = Depends(get_db)):
    shipment = Shipment(**payload.model_dump())
    db.add(shipment)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        detail = str(e.orig)
        if "shipper_id" in detail:
            raise HTTPException(status_code=422, detail="shipper_id does not reference a valid party")
        if "consignee_id" in detail:
            raise HTTPException(status_code=422, detail="consignee_id does not reference a valid party")
        raise HTTPException(status_code=422, detail="Invalid reference — check shipper_id and consignee_id")
    db.refresh(shipment)
    return _to_read(shipment)


@router.get("/{shipment_id}", response_model=ShipmentReadWithParties)
def get_shipment(shipment_id: uuid.UUID, db: Session = Depends(get_db)):
    shipment = _get_or_404(db, shipment_id)
    data = ShipmentReadWithParties.model_validate(shipment)
    data.allowed_next_statuses = list(STATUS_TRANSITIONS[shipment.status])
    return data


@router.patch("/{shipment_id}", response_model=ShipmentRead)
def update_shipment(
    shipment_id: uuid.UUID, payload: ShipmentUpdate, db: Session = Depends(get_db)
):
    shipment = _get_or_404(db, shipment_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(shipment, field, value)
    db.commit()
    db.refresh(shipment)
    return _to_read(shipment)


@router.patch("/{shipment_id}/status", response_model=ShipmentRead)
def update_shipment_status(
    shipment_id: uuid.UUID,
    payload: ShipmentStatusUpdate,
    db: Session = Depends(get_db),
):
    shipment = _get_or_404(db, shipment_id)
    if not shipment.can_transition_to(payload.status):
        allowed = [s.value for s in STATUS_TRANSITIONS[shipment.status]]
        raise HTTPException(
            status_code=422,
            detail=f"Cannot transition from '{shipment.status.value}' to "
                   f"'{payload.status.value}'. Allowed: {allowed}",
        )
    shipment.status = payload.status
    db.commit()
    db.refresh(shipment)
    return _to_read(shipment)


@router.delete("/{shipment_id}", status_code=204)
def delete_shipment(shipment_id: uuid.UUID, db: Session = Depends(get_db)):
    shipment = _get_or_404(db, shipment_id)
    db.delete(shipment)
    db.commit()


from fastapi.responses import StreamingResponse
from io import BytesIO
from app.models.party import Party
from app.models.document import Document
from app.services.report import generate_shipment_report


@router.get("/{shipment_id}/report/json")
def get_shipment_report_json(shipment_id: uuid.UUID, db: Session = Depends(get_db)):
    """Returns shipment summary as JSON for on-screen view."""
    shipment = _get_or_404(db, shipment_id)
    shipper = db.query(Party).filter(Party.id == shipment.shipper_id).first()
    consignee = db.query(Party).filter(Party.id == shipment.consignee_id).first()
    documents = db.query(Document).filter(Document.shipment_id == shipment_id).all()

    return {
        "shipment": {
            "ref_number": shipment.ref_number,
            "status": shipment.status.value,
            "direction": shipment.direction.value,
            "origin_country": shipment.origin_country,
            "origin_port": shipment.origin_port,
            "destination_country": shipment.destination_country,
            "destination_port": shipment.destination_port,
            "incoterms": shipment.incoterms.value if shipment.incoterms else None,
            "commodity": shipment.commodity,
            "hs_code": shipment.hs_code,
            "gross_weight_kg": shipment.gross_weight_kg,
            "etd": str(shipment.etd) if shipment.etd else None,
            "eta": str(shipment.eta) if shipment.eta else None,
            "ata": str(shipment.ata) if shipment.ata else None,
            "notes": shipment.notes,
        },
        "shipper": {"name": shipper.name, "country": shipper.country, "city": shipper.city, "tax_pin": shipper.tax_pin} if shipper else None,
        "consignee": {"name": consignee.name, "country": consignee.country, "city": consignee.city, "tax_pin": consignee.tax_pin} if consignee else None,
        "documents": [
            {
                "filename": d.filename,
                "doc_type": d.doc_type.value,
                "status": d.status.value,
                "file_size_bytes": d.file_size_bytes,
                "parsed_data": d.parsed_data,
            }
            for d in documents
        ],
    }


@router.get("/{shipment_id}/report/pdf")
def get_shipment_report_pdf(shipment_id: uuid.UUID, db: Session = Depends(get_db)):
    """Generates and streams a PDF shipment summary report."""
    shipment = _get_or_404(db, shipment_id)
    shipper = db.query(Party).filter(Party.id == shipment.shipper_id).first()
    consignee = db.query(Party).filter(Party.id == shipment.consignee_id).first()
    documents = db.query(Document).filter(Document.shipment_id == shipment_id).all()

    pdf_bytes = generate_shipment_report(shipment, shipper, consignee, documents)

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="tradelog-{shipment.ref_number}.pdf"'
        }
    )