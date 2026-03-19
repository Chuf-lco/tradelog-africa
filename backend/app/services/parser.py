import json
import os
from groq import Groq
from app.models.document import DocumentType

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

# Prompt templates per document type
PROMPTS = {
    DocumentType.commercial_invoice: """
You are a trade document parser. Extract structured data from this commercial invoice.

Return ONLY a JSON object with these fields (use null for missing fields):
{
  "invoice_number": string,
  "invoice_date": string (YYYY-MM-DD),
  "seller_name": string,
  "seller_country": string,
  "buyer_name": string,
  "buyer_country": string,
  "currency": string (3-letter code e.g. USD, KES),
  "subtotal": number,
  "tax_amount": number,
  "total_value": number,
  "payment_terms": string,
  "line_items": [
    {
      "description": string,
      "quantity": number,
      "unit": string,
      "unit_price": number,
      "total": number
    }
  ],
  "notes": string
}

Document text:
""",

    DocumentType.bill_of_lading: """
You are a trade document parser. Extract structured data from this bill of lading.

Return ONLY a JSON object with these fields (use null for missing fields):
{
  "bl_number": string,
  "issue_date": string (YYYY-MM-DD),
  "shipper_name": string,
  "consignee_name": string,
  "notify_party": string,
  "vessel_name": string,
  "voyage_number": string,
  "port_of_loading": string,
  "port_of_discharge": string,
  "place_of_delivery": string,
  "etd": string (YYYY-MM-DD),
  "eta": string (YYYY-MM-DD),
  "containers": [
    {
      "container_number": string,
      "seal_number": string,
      "size_type": string,
      "gross_weight_kg": number,
      "volume_cbm": number
    }
  ],
  "total_packages": number,
  "description_of_goods": string,
  "freight_terms": string,
  "incoterms": string
}

Document text:
""",

    DocumentType.packing_list: """
You are a trade document parser. Extract structured data from this packing list.

Return ONLY a JSON object with these fields (use null for missing fields):
{
  "packing_list_number": string,
  "date": string (YYYY-MM-DD),
  "seller_name": string,
  "buyer_name": string,
  "invoice_reference": string,
  "total_packages": number,
  "total_gross_weight_kg": number,
  "total_net_weight_kg": number,
  "total_volume_cbm": number,
  "items": [
    {
      "description": string,
      "quantity": number,
      "unit": string,
      "packages": number,
      "net_weight_kg": number,
      "gross_weight_kg": number,
      "dimensions_cm": string
    }
  ]
}

Document text:
""",
}

# Fallback prompt for other document types
FALLBACK_PROMPT = """
You are a trade document parser. Extract all key information from this trade document.

Return ONLY a JSON object with the most relevant fields you can identify.
Include dates in YYYY-MM-DD format, numbers as numbers (not strings).

Document text:
"""


def get_prompt(doc_type: DocumentType) -> str:
    return PROMPTS.get(doc_type, FALLBACK_PROMPT)


def parse_document(doc_type: DocumentType, document_text: str) -> dict:
    """
    Send document text to Groq and return extracted fields as a dict.
    Raises ValueError if the model returns unparseable JSON.
    """
    prompt = get_prompt(doc_type)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a precise trade document parser. "
                    "Always respond with valid JSON only. "
                    "No markdown, no explanation, no code blocks — just the raw JSON object."
                ),
            },
            {
                "role": "user",
                "content": prompt + document_text,
            },
        ],
        temperature=0.1,  # low temperature for consistent extraction
        max_tokens=2048,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown code blocks if the model includes them anyway
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model returned invalid JSON: {e}\nRaw response: {raw[:500]}")