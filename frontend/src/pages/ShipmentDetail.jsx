import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShipment, updateShipmentStatus } from "../api/shipments";
import { getDocuments, deleteDocument } from "../api/documents";
import DocumentUpload from "../components/DocumentUpload";
import ParsePanel from "../components/ParsePanel";

const STATUS_ORDER = ["draft", "in_transit", "at_customs", "customs_cleared", "delivered"];

const STATUS_COLORS = {
  draft: { bg: "#f1efe8", color: "#5f5e5a" },
  in_transit: { bg: "#e6f1fb", color: "#185fa5" },
  at_customs: { bg: "#faeeda", color: "#854f0b" },
  customs_cleared: { bg: "#eaf3de", color: "#3b6d11" },
  delivered: { bg: "#eeedfe", color: "#534ab7" },
  on_hold: { bg: "#faece7", color: "#993c1d" },
};

const STATUS_LABELS = {
  draft: "Draft",
  in_transit: "In Transit",
  at_customs: "At Customs",
  customs_cleared: "Customs Cleared",
  delivered: "Delivered",
  on_hold: "On Hold",
};

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    Promise.all([getShipment(id), getDocuments(id)])
      .then(([s, docs]) => { setShipment(s); setDocuments(docs); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const updated = await updateShipmentStatus(id, newStatus);
      setShipment(updated);
    } catch (e) {
      alert(e.response?.data?.detail || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm("Delete this document?")) return;
    await deleteDocument(id, docId);
    setDocuments(documents.filter((d) => d.id !== docId));
  };

  if (loading) return <p style={{ color: "#888", fontSize: "14px" }}>Loading...</p>;
  if (!shipment) return <p style={{ color: "#e24b4a", fontSize: "14px" }}>Shipment not found</p>;

  const currentIdx = STATUS_ORDER.indexOf(shipment.status);

  return (
    <div>
      <button
        onClick={() => navigate("/")}
        style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "1.5rem" }}
      >
        ← Back to shipments
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 500, margin: "0 0 4px" }}>{shipment.ref_number}</h1>
          <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
            {shipment.origin_country} → {shipment.destination_country} &nbsp;·&nbsp;
            {shipment.direction === "import_" ? "Import" : "Export"}
          </p>
        </div>
        <span style={{
          fontSize: "12px", fontWeight: 500, padding: "4px 12px", borderRadius: "20px",
          background: STATUS_COLORS[shipment.status]?.bg,
          color: STATUS_COLORS[shipment.status]?.color,
        }}>
          {STATUS_LABELS[shipment.status] || shipment.status}
        </span>
      </div>

      {/* Status tracker */}
      <div style={{ background: "#fff", border: "1px solid #e5e3dc", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "12px", fontWeight: 500, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 1rem" }}>
          Status
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1rem" }}>
          {STATUS_ORDER.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STATUS_ORDER.length - 1 ? 1 : "none" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: 500,
                  background: done ? "#1D9E75" : active ? "#534AB7" : "#f1efe8",
                  color: done || active ? "#fff" : "#aaa",
                  border: active ? "2px solid #534AB7" : "none",
                }}>
                  {done ? "✓" : i + 1}
                </div>
                {i < STATUS_ORDER.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: done ? "#1D9E75" : "#e5e3dc" }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {shipment.allowed_next_statuses.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusUpdate(s)}
              disabled={statusUpdating}
              style={{
                fontSize: "13px", padding: "6px 14px", borderRadius: "6px",
                border: "1px solid #e5e3dc", background: "#fff", cursor: "pointer",
                color: "#1a1a1a", opacity: statusUpdating ? 0.5 : 1,
              }}
            >
              Move to: {STATUS_LABELS[s] || s}
            </button>
          ))}
          {shipment.allowed_next_statuses.length === 0 && (
            <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>
              {shipment.status === "delivered" ? "Shipment complete." : "No transitions available."}
            </p>
          )}
        </div>
      </div>

      {/* Shipment details */}
      <div style={{ background: "#fff", border: "1px solid #e5e3dc", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "12px", fontWeight: 500, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 1rem" }}>
          Details
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            ["Commodity", shipment.commodity],
            ["HS Code", shipment.hs_code],
            ["Incoterms", shipment.incoterms],
            ["Weight", shipment.gross_weight_kg ? `${shipment.gross_weight_kg} kg` : null],
            ["ETD", shipment.etd],
            ["ETA", shipment.eta],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label}>
              <p style={{ fontSize: "12px", color: "#aaa", margin: "0 0 2px" }}>{label}</p>
              <p style={{ fontSize: "14px", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Documents */}
<div style={{ background: "#fff", border: "1px solid #e5e3dc", borderRadius: "10px", padding: "1.25rem" }}>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
    <p style={{ fontSize: "12px", fontWeight: 500, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
      Documents ({documents.length})
    </p>
  </div>
  {documents.length > 0 && (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1rem" }}>
      {documents.map((doc) => (
        <div key={doc.id} style={{ padding: "12px", background: "#f8f7f4", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 2px" }}>{doc.filename}</p>
              <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>
                {doc.doc_type.replace(/_/g, " ")}
                {doc.file_size_bytes ? ` · ${(doc.file_size_bytes / 1024).toFixed(1)} KB` : ""}
              </p>
            </div>
            <button
              onClick={() => handleDeleteDoc(doc.id)}
              style={{ background: "none", border: "none", color: "#e24b4a", cursor: "pointer", fontSize: "13px" }}
            >
              Delete
            </button>
          </div>
          <ParsePanel
            shipmentId={id}
            doc={doc}
            onUpdated={(updated) => setDocuments(documents.map(d => d.id === updated.id ? updated : d))}
          />
        </div>
      ))}
    </div>
  )}
  <DocumentUpload
    shipmentId={id}
    onUploaded={(doc) => setDocuments((prev) => [...prev, doc])}
  />
</div>
    </div>
  );
}