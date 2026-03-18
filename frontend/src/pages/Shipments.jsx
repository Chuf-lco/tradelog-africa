import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getShipments } from "../api/shipments";

const STATUS_COLORS = {
  draft: { bg: "#f1efe8", color: "#5f5e5a" },
  in_transit: { bg: "#e6f1fb", color: "#185fa5" },
  at_customs: { bg: "#faeeda", color: "#854f0b" },
  customs_cleared: { bg: "#eaf3de", color: "#3b6d11" },
  delivered: { bg: "#eeedfe", color: "#534ab7" },
  on_hold: { bg: "#faece7", color: "#993c1d" },
};

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getShipments()
      .then(setShipments)
      .catch(() => setError("Failed to load shipments"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "#888", fontSize: "14px" }}>Loading shipments...</p>;
  if (error) return <p style={{ color: "#e24b4a", fontSize: "14px" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 500, margin: 0 }}>Shipments</h1>
      </div>

      {shipments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontSize: "14px" }}>
          No shipments yet. Create one via the API to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {shipments.map((s) => {
            const statusStyle = STATUS_COLORS[s.status] || STATUS_COLORS.draft;
            return (
              <div
                key={s.id}
                onClick={() => navigate(`/shipments/${s.id}`)}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e3dc",
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#bbb"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e3dc"}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: "14px", marginBottom: "4px" }}>
                    {s.ref_number}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888" }}>
                    {s.origin_country} → {s.destination_country}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#aaa" }}>
                    {s.direction === "import_" ? "Import" : "Export"}
                  </span>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: statusStyle.bg,
                    color: statusStyle.color,
                  }}>
                    {s.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}