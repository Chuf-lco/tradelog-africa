import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Shipments from "./pages/Shipments";
import ShipmentDetail from "./pages/ShipmentDetail";
import ShipmentReport from "./pages/ShipmentReport";
import Parties from "./pages/Parties";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#f8f7f4" }}>
        <nav style={{
          background: "#fff",
          borderBottom: "1px solid #e5e3dc",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          height: "56px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}>
          <span style={{
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "-0.02em",
            color: "#1a1a1a",
            marginRight: "2rem",
            flexShrink: 0,
          }}>
            TradeLog<span style={{ color: "#1D9E75" }}> Africa</span>
          </span>

          {[
            { to: "/", label: "Shipments", exact: true },
            { to: "/parties", label: "Parties" },
          ].map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                fontSize: "14px",
                color: isActive ? "#1a1a1a" : "#999",
                textDecoration: "none",
                fontWeight: isActive ? 500 : 400,
                padding: "0 1rem",
                height: "56px",
                display: "flex",
                alignItems: "center",
                borderBottom: isActive ? "2px solid #1D9E75" : "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
          <Routes>
            <Route path="/" element={<Shipments />} />
            <Route path="/shipments/:id" element={<ShipmentDetail />} />
            <Route path="/shipments/:id/report" element={<ShipmentReport />} />
            <Route path="/parties" element={<Parties />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}