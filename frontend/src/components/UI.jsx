// Skeleton loader for list pages
export function SkeletonCard() {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e3dc",
      borderRadius: "10px",
      padding: "1rem 1.25rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <div>
        <div style={{ width: "140px", height: "14px", background: "#f1efe8", borderRadius: "4px", marginBottom: "8px" }} />
        <div style={{ width: "100px", height: "12px", background: "#f8f7f4", borderRadius: "4px" }} />
      </div>
      <div style={{ width: "72px", height: "24px", background: "#f1efe8", borderRadius: "20px" }} />
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ opacity: 1 - i * 0.15 }}>
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

// Empty state with icon and CTA
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "4rem 2rem",
      textAlign: "center",
    }}>
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: "16px",
        background: "#f1efe8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "1rem",
        fontSize: "24px",
      }}>
        {icon}
      </div>
      <p style={{ fontSize: "15px", fontWeight: 500, color: "#1a1a1a", margin: "0 0 6px" }}>
        {title}
      </p>
      <p style={{ fontSize: "13px", color: "#aaa", margin: "0 0 1.25rem", maxWidth: "300px", lineHeight: 1.6 }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize: "13px",
            padding: "8px 18px",
            borderRadius: "6px",
            border: "1px solid #e5e3dc",
            background: "#fff",
            cursor: "pointer",
            color: "#1a1a1a",
            fontWeight: 500,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Error state
export function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "3rem 2rem",
      textAlign: "center",
    }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        background: "#fcebeb", display: "flex",
        alignItems: "center", justifyContent: "center",
        marginBottom: "1rem", fontSize: "20px",
      }}>
        !
      </div>
      <p style={{ fontSize: "14px", color: "#e24b4a", margin: "0 0 12px" }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontSize: "13px", padding: "6px 14px", borderRadius: "6px",
            border: "1px solid #e5e3dc", background: "#fff",
            cursor: "pointer", color: "#888",
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}