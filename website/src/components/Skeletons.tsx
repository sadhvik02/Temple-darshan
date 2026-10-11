export function CardSkeleton() {
  return (
    <div className="card" style={{ pointerEvents: "none" }}>
      <div className="skeleton" style={{ height: "180px", width: "100%" }} />
      <div className="card-body">
        <div className="skeleton" style={{ height: "20px", width: "70%", marginBottom: "12px" }} />
        <div className="skeleton" style={{ height: "14px", width: "95%", marginBottom: "8px" }} />
        <div className="skeleton" style={{ height: "14px", width: "80%", marginBottom: "20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
          <div className="skeleton" style={{ height: "24px", width: "35%" }} />
          <div className="skeleton" style={{ height: "28px", width: "30%", borderRadius: "6px" }} />
        </div>
      </div>
    </div>
  );
}

export function CardsGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="cards-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function SectionHeaderSkeleton() {
  return (
    <div className="section-header" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div className="skeleton" style={{ height: "22px", width: "130px", borderRadius: "9999px", marginBottom: "12px" }} />
      <div className="skeleton" style={{ height: "34px", width: "320px", marginBottom: "12px" }} />
      <div className="skeleton" style={{ height: "16px", width: "420px" }} />
    </div>
  );
}
