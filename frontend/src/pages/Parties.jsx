import { useEffect, useState } from "react";
import { getParties } from "../api/parties";
import { SkeletonList, EmptyState, ErrorState } from "../components/UI";

const ROLE_COLORS = {
  importer: { bg: "#e6f1fb", color: "#185fa5" },
  exporter: { bg: "#eaf3de", color: "#3b6d11" },
  agent: { bg: "#eeedfe", color: "#534ab7" },
  customs_broker: { bg: "#faeeda", color: "#854f0b" },
  freight_forwarder: { bg: "#faece7", color: "#993c1d" },
};

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getParties()
      .then(setParties)
      .catch(() => setError("Could not load parties. Is the API running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 2px", letterSpacing: "-0.01em" }}>Parties</h1>
          {!loading && !error && (
            <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>
              {parties.length} {parties.length === 1 ? "party" : "parties"}
            </p>
          )}
        </div>
      </div>

      {loading && <SkeletonList count={3} />}

      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && parties.length === 0 && (
        <EmptyState
          icon="🏢"
          title="No parties yet"
          description="Create importers, exporters, customs brokers and freight forwarders via the API to attach them to shipments."
        />
      )}

      {!loading && !error && parties.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {parties.map((p) => {
            const roleStyle = ROLE_COLORS[p.role] || ROLE_COLORS.agent;
            return (
              <div key={p.id} style={{
                background: "#fff",
                border: "1px solid #e5e3dc",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "14px", marginBottom: "4px", color: "#1a1a1a" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: "13px", color: "#999" }}>
                    {p.country}
                    {p.city && <span> · {p.city}</span>}
                    {p.tax_pin && <span style={{ margin: "0 4px", color: "#ddd" }}>·</span>}
                    {p.tax_pin && <span>PIN: {p.tax_pin}</span>}
                  </div>
                </div>
                <span style={{
                  fontSize: "12px", fontWeight: 500,
                  padding: "3px 10px", borderRadius: "20px",
                  background: roleStyle.bg, color: roleStyle.color,
                }}>
                  {p.role.replace(/_/g, " ")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}