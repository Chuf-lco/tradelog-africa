import { useState } from "react";
import { uploadDocument } from "../api/documents";

const DOC_TYPES = [
  { value: "bill_of_lading", label: "Bill of Lading" },
  { value: "airway_bill", label: "Airway Bill" },
  { value: "commercial_invoice", label: "Commercial Invoice" },
  { value: "packing_list", label: "Packing List" },
  { value: "certificate_of_origin", label: "Certificate of Origin" },
  { value: "customs_entry", label: "Customs Entry" },
  { value: "phytosanitary", label: "Phytosanitary Certificate" },
  { value: "insurance_certificate", label: "Insurance Certificate" },
  { value: "other", label: "Other" },
];

export default function DocumentUpload({ shipmentId, onUploaded }) {
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState("commercial_invoice");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reset = () => {
    setDocType("commercial_invoice");
    setFile(null);
    setError(null);
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!file) { setError("Please select a file."); return; }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        doc_type: docType,
        filename: file.name,
        file_path: `/uploads/${shipmentId}/${file.name}`,
        mime_type: file.type || null,
        file_size_bytes: file.size,
        shipment_id: shipmentId,
      };
      const created = await uploadDocument(shipmentId, payload);
      onUploaded(created);
      reset();
    } catch (e) {
      setError(e.response?.data?.detail || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            fontSize: "13px", padding: "6px 14px", borderRadius: "6px",
            border: "1px solid #e5e3dc", background: "#fff",
            cursor: "pointer", color: "#1a1a1a",
          }}
        >
          + Add document
        </button>
      ) : (
        <div style={{
          background: "#f8f7f4", border: "1px solid #e5e3dc",
          borderRadius: "10px", padding: "1.25rem", marginTop: "1rem",
        }}>
          <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 1rem" }}>
            Add document
          </p>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>
              Document type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={{
                width: "100%", fontSize: "13px", padding: "8px 10px",
                border: "1px solid #e5e3dc", borderRadius: "6px",
                background: "#fff", color: "#1a1a1a", cursor: "pointer",
              }}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "4px" }}>
              File
            </label>
            <div
              onClick={() => document.getElementById("doc-file-input").click()}
              style={{
                border: "1.5px dashed #d3d1c7", borderRadius: "8px",
                padding: "1.5rem", textAlign: "center", cursor: "pointer",
                background: file ? "#eaf3de" : "#fff",
                transition: "background 0.15s",
              }}
            >
              {file ? (
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 2px", color: "#3b6d11" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                    {(file.size / 1024).toFixed(1)} KB · click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "13px", color: "#888", margin: "0 0 2px" }}>
                    Click to select a file
                  </p>
                  <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>
                    PDF, JPG, PNG supported
                  </p>
                </div>
              )}
            </div>
            <input
              id="doc-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#e24b4a", margin: "0 0 12px" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                fontSize: "13px", padding: "7px 16px", borderRadius: "6px",
                border: "none", background: "#1a1a1a", color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Saving..." : "Save document"}
            </button>
            <button
              onClick={reset}
              disabled={loading}
              style={{
                fontSize: "13px", padding: "7px 16px", borderRadius: "6px",
                border: "1px solid #e5e3dc", background: "#fff",
                cursor: "pointer", color: "#888",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}