from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime

TEAL = colors.HexColor("#1D9E75")
PURPLE = colors.HexColor("#534AB7")
LIGHT_GRAY = colors.HexColor("#F1EFE8")
MID_GRAY = colors.HexColor("#888780")
DARK = colors.HexColor("#1A1A1A")
BORDER = colors.HexColor("#E5E3DC")


def build_styles():
    styles = getSampleStyleSheet()
    custom = {
        "title": ParagraphStyle("title", fontSize=22, textColor=DARK,
                                fontName="Helvetica-Bold", spaceAfter=4),
        "subtitle": ParagraphStyle("subtitle", fontSize=11, textColor=MID_GRAY,
                                   fontName="Helvetica", spaceAfter=2),
        "section": ParagraphStyle("section", fontSize=9, textColor=MID_GRAY,
                                  fontName="Helvetica-Bold", spaceBefore=16,
                                  spaceAfter=6, textTransform="uppercase"),
        "body": ParagraphStyle("body", fontSize=10, textColor=DARK,
                               fontName="Helvetica", spaceAfter=4),
        "label": ParagraphStyle("label", fontSize=8, textColor=MID_GRAY,
                                fontName="Helvetica", spaceAfter=1),
        "value": ParagraphStyle("value", fontSize=10, textColor=DARK,
                                fontName="Helvetica-Bold", spaceAfter=8),
        "footer": ParagraphStyle("footer", fontSize=8, textColor=MID_GRAY,
                                 fontName="Helvetica", alignment=TA_CENTER),
    }
    return custom


def field_block(label, value, styles):
    return [
        Paragraph(label.upper(), styles["label"]),
        Paragraph(str(value) if value else "—", styles["value"]),
    ]


def generate_shipment_report(shipment, shipper, consignee, documents) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )
    styles = build_styles()
    story = []

    # Header
    story.append(Paragraph("TradeLog Africa", styles["title"]))
    story.append(Paragraph("Shipment Summary Report", styles["subtitle"]))
    story.append(Paragraph(
        f"Generated {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}",
        styles["subtitle"]
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceAfter=12))

    # Shipment overview
    story.append(Paragraph("Shipment", styles["section"]))
    overview_data = [
        [Paragraph("Reference", styles["label"]), Paragraph("Status", styles["label"]),
         Paragraph("Direction", styles["label"]), Paragraph("Incoterms", styles["label"])],
        [Paragraph(shipment.ref_number or "—", styles["value"]),
         Paragraph(shipment.status.value.replace("_", " ").title(), styles["value"]),
         Paragraph(shipment.direction.value.title(), styles["value"]),
         Paragraph(shipment.incoterms.value if shipment.incoterms else "—", styles["value"])],
    ]
    overview_table = Table(overview_data, colWidths=["25%", "25%", "25%", "25%"])
    overview_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white]),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(overview_table)
    story.append(Spacer(1, 8))

    # Route
    route_data = [
        [Paragraph("Origin country", styles["label"]),
         Paragraph("Origin port", styles["label"]),
         Paragraph("Destination country", styles["label"]),
         Paragraph("Destination port", styles["label"])],
        [Paragraph(shipment.origin_country or "—", styles["value"]),
         Paragraph(shipment.origin_port or "—", styles["value"]),
         Paragraph(shipment.destination_country or "—", styles["value"]),
         Paragraph(shipment.destination_port or "—", styles["value"])],
    ]
    route_table = Table(route_data, colWidths=["25%", "25%", "25%", "25%"])
    route_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(route_table)
    story.append(Spacer(1, 8))

    # Dates
    dates_data = [
        [Paragraph("ETD", styles["label"]),
         Paragraph("ETA", styles["label"]),
         Paragraph("ATA", styles["label"]),
         Paragraph("Commodity", styles["label"])],
        [Paragraph(str(shipment.etd) if shipment.etd else "—", styles["value"]),
         Paragraph(str(shipment.eta) if shipment.eta else "—", styles["value"]),
         Paragraph(str(shipment.ata) if shipment.ata else "—", styles["value"]),
         Paragraph(shipment.commodity or "—", styles["value"])],
    ]
    dates_table = Table(dates_data, colWidths=["25%", "25%", "25%", "25%"])
    dates_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(dates_table)

    # Parties
    story.append(Paragraph("Parties", styles["section"]))
    parties_data = [
        [Paragraph("Shipper", styles["label"]), Paragraph("Consignee", styles["label"])],
        [Paragraph(shipper.name if shipper else "—", styles["value"]),
         Paragraph(consignee.name if consignee else "—", styles["value"])],
        [Paragraph(f"{shipper.country}{', ' + shipper.city if shipper and shipper.city else ''}" if shipper else "—", styles["body"]),
         Paragraph(f"{consignee.country}{', ' + consignee.city if consignee and consignee.city else ''}" if consignee else "—", styles["body"])],
        [Paragraph(shipper.tax_pin or "—", styles["body"]),
         Paragraph(consignee.tax_pin or "—", styles["body"])],
    ]
    parties_table = Table(parties_data, colWidths=["50%", "50%"])
    parties_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(parties_table)

    # Documents
    story.append(Paragraph("Documents", styles["section"]))
    if not documents:
        story.append(Paragraph("No documents attached.", styles["body"]))
    else:
        doc_data = [[
            Paragraph("Filename", styles["label"]),
            Paragraph("Type", styles["label"]),
            Paragraph("Status", styles["label"]),
            Paragraph("Size", styles["label"]),
        ]]
        for d in documents:
            size = f"{(d.file_size_bytes / 1024):.1f} KB" if d.file_size_bytes else "—"
            doc_data.append([
                Paragraph(d.filename, styles["body"]),
                Paragraph(d.doc_type.value.replace("_", " ").title(), styles["body"]),
                Paragraph(d.status.value, styles["body"]),
                Paragraph(size, styles["body"]),
            ])
        doc_table = Table(doc_data, colWidths=["40%", "25%", "20%", "15%"])
        doc_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(doc_table)

        # Verified parsed data sections
        verified_docs = [d for d in documents if d.status.value == "verified" and d.parsed_data]
        if verified_docs:
            story.append(Paragraph("Extracted document data", styles["section"]))
            for d in verified_docs:
                story.append(Paragraph(
                    f"{d.doc_type.value.replace('_', ' ').title()} — {d.filename}",
                    styles["body"]
                ))
                parsed = d.parsed_data

                PRIORITY_FIELDS = [
                    "invoice_number", "bl_number", "packing_list_number",
                    "invoice_date", "issue_date", "date",
                    "seller_name", "seller_country",
                    "buyer_name", "buyer_country",
                    "currency", "subtotal", "tax_amount", "total_value",
                    "total_gross_weight_kg", "total_net_weight_kg", "total_volume_cbm",
                    "payment_terms", "incoterms", "freight_terms",
                    "vessel_name", "voyage_number",
                    "port_of_loading", "port_of_discharge",
                    "notes",
                ]

                def sort_key(item):
                    try:
                        return PRIORITY_FIELDS.index(item[0])
                    except ValueError:
                        return len(PRIORITY_FIELDS)

                sorted_parsed = dict(sorted(parsed.items(), key=sort_key))
                flat_fields = {k: v for k, v in sorted_parsed.items() if not isinstance(v, list)}
                list_fields = {k: v for k, v in sorted_parsed.items() if isinstance(v, list)}

                if flat_fields:
                    field_data = [[
                        Paragraph(k.replace("_", " ").upper(), styles["label"]),
                        Paragraph(str(v) if v is not None else "—", styles["body"])
                    ] for k, v in flat_fields.items()]
                    field_table = Table(field_data, colWidths=["35%", "65%"])
                    field_table.setStyle(TableStyle([
                        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
                    ]))
                    story.append(field_table)
                    story.append(Spacer(1, 6))

                for list_key, list_val in list_fields.items():
                    if list_val:
                        story.append(Paragraph(list_key.replace("_", " ").upper(), styles["label"]))
                        raw_headers = list(list_val[0].keys()) if isinstance(list_val[0], dict) else ["value"]
                        # Put description-like fields first
                        priority_cols = ["description", "item", "name", "goods"]
                        headers = sorted(raw_headers, key=lambda h: (0 if h in priority_cols else 1, h))
                        li_data = [[Paragraph(h.replace("_", " ").upper(), styles["label"]) for h in headers]]
                        for item in list_val:
                            if isinstance(item, dict):
                                li_data.append([
                                    Paragraph(str(item.get(h, "—")) if item.get(h) is not None else "—", styles["body"])
                                    for h in headers
                                ])
                        col_w = f"{100 // len(headers)}%"
                        li_table = Table(li_data, colWidths=[col_w] * len(headers))
                        li_table.setStyle(TableStyle([
                            ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
                            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
                            ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                            ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
                            ("TOPPADDING", (0, 0), (-1, -1), 4),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                            ("LEFTPADDING", (0, 0), (-1, -1), 8),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ]))
                        story.append(li_table)
                        story.append(Spacer(1, 6))

    # Notes
    if shipment.notes:
        story.append(Paragraph("Notes", styles["section"]))
        story.append(Paragraph(shipment.notes, styles["body"]))

    # Footer
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=6))
    story.append(Paragraph(
        f"TradeLog Africa  ·  {shipment.ref_number}  ·  Generated {datetime.utcnow().strftime('%d %B %Y')}",
        styles["footer"]
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()