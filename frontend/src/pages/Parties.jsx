import { useEffect, useState } from "react";
import { getParties } from "../api/parties";

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

  useEffect(() => {
    getParties()
      .then(setParties)
      .catch(() => setError("Failed to load parties"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "#888", fontSize: "14px" }}>Loading parties...</p>;
  if (error) return <p style={{ color: "#e24b4a", fontSize: "14px" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 500, margin: 0 }}>Parties</h1>
      </div>

      {parties.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontSize: "14px" }}>
          No parties yet. Create one via the API to get started.
        </div>
      ) : (
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
                  <div style={{ fontWeight: 500, fontSize: "14px", marginBottom: "4px" }}>{p.name}</div>
                  <div style={{ fontSize: "13px", color: "#888" }}>
                    {p.country}{p.city ? ` · ${p.city}` : ""}
                    {p.tax_pin ? ` · PIN: ${p.tax_pin}` : ""}
                  </div>
                </div>
                <span style={{
                  fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "20px",
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