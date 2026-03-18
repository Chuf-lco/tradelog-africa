import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Shipments from "./pages/Shipments";
import ShipmentDetail from "./pages/ShipmentDetail";
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
          gap: "2rem",
          height: "56px",
        }}>
          <span style={{ fontWeight: 600, fontSize: "15px", letterSpacing: "-0.01em" }}>
            TradeLog Africa
          </span>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              fontSize: "14px",
              color: isActive ? "#1a1a1a" : "#888",
              textDecoration: "none",
              fontWeight: isActive ? 500 : 400,
            })}
          >
            Shipments
          </NavLink>
          <NavLink
            to="/parties"
            style={({ isActive }) => ({
              fontSize: "14px",
              color: isActive ? "#1a1a1a" : "#888",
              textDecoration: "none",
              fontWeight: isActive ? 500 : 400,
            })}
          >
            Parties
          </NavLink>
        </nav>

        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>
          <Routes>
            <Route path="/" element={<Shipments />} />
            <Route path="/shipments/:id" element={<ShipmentDetail />} />
            <Route path="/parties" element={<Parties />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}