import { useState } from "react";
import client from "../api/client";

const STATUS_COLORS = {
  uploaded: { bg: "#f1efe8", color: "#5f5e5a" },
  parsing: { bg: "#e6f1fb", color: "#185fa5" },
  parsed: { bg: "#faeeda", color: "#854f0b" },
  verified: { bg: "#eaf3de", color: "#3b6d11" },
  rejected: { bg: "#faece7", color: "#993c1d" },
};

export default function ParsePanel({ shipmentId, doc, onUpdated }) {
  const [documentText, setDocumentText] = useState("");
  const [extracted, setExtracted] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);

  const handleParse = async () => {
    if (!documentText.trim()) { setError("Paste the document text first."); return; }
    setParsing(true);
    setError(null);
    setExtracted(null);
    try {
      const form = new FormData();
      form.append("document_text", documentText);
      const res = await client.post(
        `/shipments/${shipmentId}/documents/${doc.id}/parse`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setExtracted(res.data.extracted);
    } catch (e) {
      setError(e.response?.data?.detail || "Parse failed.");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await client.post(
        `/shipments/${shipmentId}/documents/${doc.id}/confirm`,
        { parsed_data: extracted, status: "verified" }
      );
      onUpdated(res.data);
      setExtracted(null);
      setDocumentText("");
      setShowTextInput(false);
    } catch (e) {
      setError(e.response?.data?.detail || "Confirm failed.");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    try {
      const res = await client.post(
        `/shipments/${shipmentId}/documents/${doc.id}/reject`
      );
      onUpdated(res.data);
      setExtracted(null);
      setDocumentText("");
    } catch (e) {
      setError(e.response?.data?.detail || "Reject failed.");
    }
  };

  const statusStyle = STATUS_COLORS[doc.status] || STATUS_COLORS.uploaded;

  // Already verified — show parsed data read-only
  if (doc.status === "verified" && doc.parsed_data) {
    return (
      <div style={{ marginTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px",
            background: statusStyle.bg, color: statusStyle.color,
          }}>verified</span>
          <span style={{ fontSize: "12px", color: "#aaa" }}>Fields extracted by AI</span>
        </div>
        <ParsedFields data={doc.parsed_data} />
      </div>
    );
  }

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{
          fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px",
          background: statusStyle.bg, color: statusStyle.color,
        }}>{doc.status}</span>
        {doc.status === "uploaded" && !showTextInput && (
          <button
            onClick={() => setShowTextInput(true)}
            style={{
              fontSize: "12px", padding: "3px 10px", borderRadius: "5px",
              border: "1px solid #e5e3dc", background: "#fff",
              cursor: "pointer", color: "#534AB7", fontWeight: 500,
            }}
          >
            Parse with AI
          </button>
        )}
      </div>

      {showTextInput && !extracted && (
        <div>
          <p style={{ fontSize: "12px", color: "#888", margin: "0 0 6px" }}>
            Paste the document text below — copy from your PDF viewer or email:
          </p>
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            rows={6}
            placeholder="Paste invoice, bill of lading, or packing list text here..."
            style={{
              width: "100%", fontSize: "13px", padding: "10px",
              border: "1px solid #e5e3dc", borderRadius: "6px",
              fontFamily: "monospace", resize: "vertical", color: "#1a1a1a",
              background: "#fafaf8",
            }}
          />
          {error && <p style={{ fontSize: "12px", color: "#e24b4a", margin: "6px 0 0" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              onClick={handleParse}
              disabled={parsing}
              style={{
                fontSize: "13px", padding: "7px 16px", borderRadius: "6px",
                border: "none", background: "#534AB7", color: "#fff",
                cursor: parsing ? "not-allowed" : "pointer", opacity: parsing ? 0.6 : 1,
              }}
            >
              {parsing ? "Parsing..." : "Extract fields"}
            </button>
            <button
              onClick={() => { setShowTextInput(false); setError(null); }}
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

      {extracted && (
        <div>
          <div style={{
            background: "#faeeda", border: "1px solid #f5c575",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "12px",
          }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#633806", margin: "0 0 2px" }}>
              Review extracted fields
            </p>
            <p style={{ fontSize: "12px", color: "#854f0b", margin: 0 }}>
              Confirm if correct, or reject to try again.
            </p>
          </div>
          <ParsedFields data={extracted} />
          {error && <p style={{ fontSize: "12px", color: "#e24b4a", margin: "8px 0 0" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              style={{
                fontSize: "13px", padding: "7px 16px", borderRadius: "6px",
                border: "none", background: "#1D9E75", color: "#fff",
                cursor: confirming ? "not-allowed" : "pointer", opacity: confirming ? 0.6 : 1,
              }}
            >
              {confirming ? "Saving..." : "Confirm & save"}
            </button>
            <button
              onClick={handleReject}
              style={{
                fontSize: "13px", padding: "7px 16px", borderRadius: "6px",
                border: "1px solid #e5e3dc", background: "#fff",
                cursor: "pointer", color: "#e24b4a",
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ParsedFields({ data }) {
  const renderValue = (val) => {
    if (val === null || val === undefined) return <span style={{ color: "#ccc" }}>—</span>;
    if (Array.isArray(val)) {
      return (
        <div style={{ marginTop: "6px" }}>
          {val.map((item, i) => (
            <div key={i} style={{
              background: "#f8f7f4", borderRadius: "6px",
              padding: "8px 10px", marginBottom: "6px", fontSize: "12px",
            }}>
              {typeof item === "object"
                ? Object.entries(item).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ color: "#aaa", minWidth: "120px" }}>{k.replace(/_/g, " ")}</span>
                      <span style={{ color: "#1a1a1a" }}>{v ?? "—"}</span>
                    </div>
                  ))
                : <span>{item}</span>
              }
            </div>
          ))}
        </div>
      );
    }
    if (typeof val === "object") {
      return (
        <div style={{ marginTop: "4px" }}>
          {Object.entries(val).map(([k, v]) => (
            <div key={k} style={{ fontSize: "12px", marginBottom: "2px" }}>
              <span style={{ color: "#aaa" }}>{k}: </span>
              <span>{v ?? "—"}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span style={{ color: "#1a1a1a" }}>{String(val)}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {Object.entries(data).map(([key, value]) => {
        const isArray = Array.isArray(value);
        return (
          <div key={key} style={{
            padding: "8px 12px", background: "#f8f7f4", borderRadius: "8px",
          }}>
            <p style={{
              fontSize: "11px", fontWeight: 500, color: "#888",
              textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px"
            }}>
              {key.replace(/_/g, " ")}
            </p>
            <div style={{ fontSize: "13px" }}>{renderValue(value)}</div>
          </div>
        );
      })}
    </div>
  );
}