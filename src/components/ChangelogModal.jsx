import { useState, useEffect, useRef } from "react";
import "./ChangelogModal.css";

const TYPE_LABELS = {
  nuevo:      { label: "Nuevo",       color: "#22c55e" },
  mejora:     { label: "Mejora",      color: "#3b82f6" },
  corrección: { label: "Corrección",  color: "#f59e0b" },
  eliminado:  { label: "Eliminado",   color: "#ef4444" },
};

export default function ChangelogModal({ onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); })
      .catch(() => { setError("No se pudieron cargar los registros."); setLoading(false); });

    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleOverlay = (e) => { if (e.target === overlayRef.current) onClose(); };

  const grouped = entries.reduce((acc, entry) => {
    const v = entry.version || "Sin versión";
    if (!acc[v]) acc[v] = [];
    acc[v].push(entry);
    return acc;
  }, {});

  return (
    <div className="cl-overlay" ref={overlayRef} onClick={handleOverlay}>
      <div className="cl-modal">
        {/* Header */}
        <div className="cl-header">
          <div className="cl-header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <h2>Registro de Cambios</h2>
          </div>
          <button className="cl-close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cl-body">
          {loading && (
            <div className="cl-state">
              <div className="cl-spinner" />
              <p>Cargando registros...</p>
            </div>
          )}
          {error && (
            <div className="cl-state cl-state--error">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div className="cl-state">
              <p>No hay registros disponibles todavía.</p>
            </div>
          )}
          {!loading && !error && Object.keys(grouped).map((version) => (
            <div key={version} className="cl-version-group">
              <div className="cl-version-tag">
                <span className="cl-version-dot" />
                {version}
              </div>
              <div className="cl-entries">
                {grouped[version].map((entry) => {
                  const typeInfo = TYPE_LABELS[entry.type] || { label: entry.type, color: "#8899bb" };
                  return (
                    <div key={entry.id} className="cl-entry">
                      <div className="cl-entry-top">
                        <span className="cl-badge" style={{ color: typeInfo.color, borderColor: typeInfo.color + "44", background: typeInfo.color + "12" }}>
                          {typeInfo.label}
                        </span>
                        <span className="cl-entry-title">{entry.title}</span>
                        <span className="cl-entry-date">
                          {new Date(entry.date + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="cl-entry-desc">{entry.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

