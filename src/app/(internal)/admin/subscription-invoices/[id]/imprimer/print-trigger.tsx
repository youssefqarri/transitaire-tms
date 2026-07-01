"use client";

export function PrintTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        padding: "8px 14px",
        fontSize: 13,
        background: "#111",
        color: "white",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
      }}
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
