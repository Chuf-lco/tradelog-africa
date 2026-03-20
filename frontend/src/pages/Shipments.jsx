import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getShipments } from "../api/shipments";
import { SkeletonList, EmptyState, ErrorState } from "../components/UI";

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

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError(null);
    getShipments()
      .then(setShipments)
      .catch(() => setError("Could not load shipments. Is the API running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 2px", letterSpacing: "-0.01em" }}>Shipments</h1>
          {!loading && !error && (
            <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>
              {shipments.length} {shipments.length === 1 ? "shipment" : "shipments"}
            </p>
          )}
        </div>
      </div>

      {loading && <SkeletonList count={4} />}

      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && shipments.length === 0 && (
        <EmptyState
          icon="📦"
          title="No shipments yet"
          description="Create your first shipment via the API to get started tracking imports and exports."
        />
      )}

      {!loading && !error && shipments.length > 0 && (
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
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#bbb";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e3dc";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: "14px", marginBottom: "4px", color: "#1a1a1a" }}>
                    {s.ref_number}
                  </div>
                  <div style={{ fontSize: "13px", color: "#999" }}>
                    {s.origin_country} → {s.destination_country}
                    <span style={{ margin: "0 6px", color: "#ddd" }}>·</span>
                    {s.direction === "import_" ? "Import" : "Export"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {s.eta && (
                    <span style={{ fontSize: "12px", color: "#bbb" }}>ETA {s.eta}</span>
                  )}
                  <span style={{
                    fontSize: "12px", fontWeight: 500,
                    padding: "3px 10px", borderRadius: "20px",
                    background: statusStyle.bg, color: statusStyle.color,
                  }}>
                    {STATUS_LABELS[s.status] || s.status}
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