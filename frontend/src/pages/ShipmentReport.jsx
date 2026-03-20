import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";

const STATUS_COLORS = {
  draft: { bg: "#f1efe8", color: "#5f5e5a" },
  in_transit: { bg: "#e6f1fb", color: "#185fa5" },
  at_customs: { bg: "#faeeda", color: "#854f0b" },
  customs_cleared: { bg: "#eaf3de", color: "#3b6d11" },
  delivered: { bg: "#eeedfe", color: "#534ab7" },
  on_hold: { bg: "#faece7", color: "#993c1d" },
};

const Section = ({ title, children }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e3dc", borderRadius: "10px", padding: "1.25rem", marginBottom: "1rem" }}>
    <p style={{ fontSize: "11px", fontWeight: 500, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 1rem" }}>
      {title}
    </p>
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p style={{ fontSize: "11px", color: "#aaa", margin: "0 0 2px" }}>{label}</p>
    <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 12px", color: "#1a1a1a" }}>{value || "—"}</p>
  </div>
);

const Grid = ({ children, cols = 3 }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px" }}>
    {children}
  </div>
);

export default function ShipmentReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    client.get(`/shipments/${id}/report/json`)
      .then(r => setReport(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await client.get(`/shipments/${id}/report/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `tradelog-${report.shipment.ref_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <p style={{ color: "#888", fontSize: "14px" }}>Generating report...</p>;
  if (!report) return <p style={{ color: "#e24b4a", fontSize: "14px" }}>Report not found</p>;

  const { shipment, shipper, consignee, documents } = report;
  const statusStyle = STATUS_COLORS[shipment.status] || STATUS_COLORS.draft;
  const verifiedDocs = documents.filter(d => d.status === "verified" && d.parsed_data);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
        <button
          onClick={() => navigate(`/shipments/${id}`)}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "13px", padding: 0 }}
        >
          ← Back to shipment
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 500, margin: "0 0 4px" }}>
            {shipment.ref_number}
          </h1>
          <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Shipment Summary Report</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{
            fontSize: "12px", fontWeight: 500, padding: "4px 12px", borderRadius: "20px",
            background: statusStyle.bg, color: statusStyle.color,
          }}>
            {shipment.status.replace(/_/g, " ")}
          </span>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{
              fontSize: "13px", padding: "7px 16px", borderRadius: "6px",
              border: "none", background: "#1D9E75", color: "#fff",
              cursor: downloading ? "not-allowed" : "pointer",
              opacity: downloading ? 0.6 : 1, fontWeight: 500,
            }}
          >
            {downloading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      <Section title="Route">
        <Grid cols={4}>
          <Field label="Origin country" value={shipment.origin_country} />
          <Field label="Origin port" value={shipment.origin_port} />
          <Field label="Destination country" value={shipment.destination_country} />
          <Field label="Destination port" value={shipment.destination_port} />
        </Grid>
        <Grid cols={4}>
          <Field label="Direction" value={shipment.direction} />
          <Field label="Incoterms" value={shipment.incoterms} />
          <Field label="HS Code" value={shipment.hs_code} />
          <Field label="Commodity" value={shipment.commodity} />
        </Grid>
        <Grid cols={3}>
          <Field label="ETD" value={shipment.etd} />
          <Field label="ETA" value={shipment.eta} />
          <Field label="ATA" value={shipment.ata} />
        </Grid>
      </Section>

      <Section title="Parties">
        <Grid cols={2}>
          <div style={{ padding: "12px", background: "#f8f7f4", borderRadius: "8px" }}>
            <p style={{ fontSize: "11px", color: "#aaa", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Shipper</p>
            {shipper ? (
              <>
                <Field label="Name" value={shipper.name} />
                <Field label="Country" value={shipper.country} />
                <Field label="City" value={shipper.city} />
                <Field label="Tax PIN" value={shipper.tax_pin} />
              </>
            ) : <p style={{ fontSize: "13px", color: "#aaa" }}>—</p>}
          </div>
          <div style={{ padding: "12px", background: "#f8f7f4", borderRadius: "8px" }}>
            <p style={{ fontSize: "11px", color: "#aaa", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Consignee</p>
            {consignee ? (
              <>
                <Field label="Name" value={consignee.name} />
                <Field label="Country" value={consignee.country} />
                <Field label="City" value={consignee.city} />
                <Field label="Tax PIN" value={consignee.tax_pin} />
              </>
            ) : <p style={{ fontSize: "13px", color: "#aaa" }}>—</p>}
          </div>
        </Grid>
      </Section>

      <Section title={`Documents (${documents.length})`}>
        {documents.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>No documents attached.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {documents.map((doc, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", background: "#f8f7f4", borderRadius: "8px",
              }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 2px" }}>{doc.filename}</p>
                  <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>
                    {doc.doc_type.replace(/_/g, " ")}
                    {doc.file_size_bytes ? ` · ${(doc.file_size_bytes / 1024).toFixed(1)} KB` : ""}
                  </p>
                </div>
                <span style={{
                  fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "20px",
                  background: doc.status === "verified" ? "#eaf3de" : "#f1efe8",
                  color: doc.status === "verified" ? "#3b6d11" : "#5f5e5a",
                }}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {verifiedDocs.length > 0 && (
        <Section title="Extracted document data">
          {verifiedDocs.map((doc, i) => (
            <div key={i} style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 12px", color: "#534AB7" }}>
                {doc.doc_type.replace(/_/g, " ")} — {doc.filename}
              </p>
              {Object.entries(doc.parsed_data).map(([key, value]) => {
                if (Array.isArray(value)) {
                  return (
                    <div key={key} style={{ marginBottom: "12px" }}>
                      <p style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>
                        {key.replace(/_/g, " ")}
                      </p>
                      {value.map((item, j) => (
                        <div key={j} style={{
                          padding: "8px 12px", background: "#f8f7f4", borderRadius: "6px", marginBottom: "4px",
                          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px",
                          fontSize: "12px",
                        }}>
                          {typeof item === "object"
                            ? Object.entries(item).map(([k, v]) => (
                                <div key={k}>
                                  <span style={{ color: "#aaa" }}>{k.replace(/_/g, " ")}: </span>
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
                return (
                  <Field
                    key={key}
                    label={key.replace(/_/g, " ")}
                    value={value !== null ? String(value) : null}
                  />
                );
              })}
            </div>
          ))}
        </Section>
      )}

      {shipment.notes && (
        <Section title="Notes">
          <p style={{ fontSize: "13px", color: "#1a1a1a", margin: 0 }}>{shipment.notes}</p>
        </Section>
      )}
    </div>
  );
}