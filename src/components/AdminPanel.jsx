import { useState, useEffect } from "react";
import "./AdminPanel.css";

const TYPE_OPTIONS = ["nuevo", "mejora", "corrección", "eliminado"];

const EMPTY_FORM = { version: "", date: "", type: "nuevo", title: "", description: "" };

export default function AdminPanel() {
  const [token, setToken] = useState(() => sessionStorage.getItem("habbup_token") || "");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [modal, setModal] = useState(null); // null | { mode: "add"|"edit", data: {...} }
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to delete

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const headers = { "Content-Type": "application/json", "x-admin-token": token };

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de autenticación");
      sessionStorage.setItem("habbup_token", data.token);
      setToken(data.token);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", headers });
    sessionStorage.removeItem("habbup_token");
    setToken("");
    setEntries([]);
  };

  // ── Load entries ─────────────────────────────────────────────────────────────
  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/changelog");
      const data = await res.json();
      setEntries(data);
    } catch {
      showToast("Error al cargar los registros", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadEntries();
  }, [token]);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      fetch("/api/auth/verify", { headers: { "x-admin-token": token } })
        .then(r => { if (!r.ok) { sessionStorage.removeItem("habbup_token"); setToken(""); } })
        .catch(() => { sessionStorage.removeItem("habbup_token"); setToken(""); });
    }
  }, []);

  // ── Modal ────────────────────────────────────────────────────────────────────
  const openAdd = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({ ...EMPTY_FORM, date: today });
    setModal({ mode: "add" });
  };

  const openEdit = (entry) => {
    setFormData({ version: entry.version, date: entry.date, type: entry.type, title: entry.title, description: entry.description });
    setModal({ mode: "edit", id: entry.id });
  };

  const closeModal = () => { setModal(null); setFormData(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.version || !formData.date || !formData.title || !formData.description) {
      showToast("Todos los campos son requeridos", "error");
      return;
    }
    setSaving(true);
    try {
      const url = modal.mode === "add" ? "/api/changelog" : `/api/changelog/${modal.id}`;
      const method = modal.mode === "add" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Error al guardar");
      showToast(modal.mode === "add" ? "Registro añadido ✓" : "Registro actualizado ✓");
      closeModal();
      loadEntries();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/changelog/${deleteConfirm}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Error al eliminar");
      showToast("Registro eliminado");
      setDeleteConfirm(null);
      loadEntries();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Type badge ───────────────────────────────────────────────────────────────
  const TYPE_COLORS = { nuevo: "#22c55e", mejora: "#3b82f6", "corrección": "#f59e0b", eliminado: "#ef4444" };

  // ════════════════════════════════════════════
  //   LOGIN PAGE
  // ════════════════════════════════════════════
  if (!token) {
    return (
      <div className="ap-login-bg">
        <div className="ap-login-glow" />
        <div className="ap-login-card">
          <div className="ap-login-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <h1>Panel Admin</h1>
            <span>HabbUP</span>
          </div>
          <form onSubmit={handleLogin} className="ap-login-form">
            <div className="ap-field">
              <label>Usuario</label>
              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={loginForm.username}
                onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="ap-field">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
              />
            </div>
            {loginError && <div className="ap-login-error">{loginError}</div>}
            <button type="submit" className="ap-btn-primary" disabled={loginLoading}>
              {loginLoading ? <span className="ap-spinner-sm" /> : "Iniciar Sesión"}
            </button>
          </form>
          <a href="/" className="ap-back-link">← Volver al hotel</a>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════
  //   ADMIN DASHBOARD
  // ════════════════════════════════════════════
  return (
    <div className="ap-dashboard">
      {/* Toast */}
      {toast && <div className={`ap-toast ap-toast--${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <header className="ap-header">
        <div className="ap-header-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <h1>Registro de Cambios</h1>
          <span className="ap-header-badge">{entries.length} entradas</span>
        </div>
        <div className="ap-header-right">
          <a href="/" className="ap-btn-ghost">← Ver hotel</a>
          <button className="ap-btn-primary" onClick={openAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Registro
          </button>
          <button className="ap-btn-ghost ap-btn-logout" onClick={handleLogout} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Table */}
      <main className="ap-main">
        {loading ? (
          <div className="ap-loading"><div className="ap-spinner" /><p>Cargando...</p></div>
        ) : entries.length === 0 ? (
          <div className="ap-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#243050" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No hay registros. ¡Crea el primero!</p>
            <button className="ap-btn-primary" onClick={openAdd}>Añadir Registro</button>
          </div>
        ) : (
          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Versión</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
                    <td><span className="ap-version">{entry.version}</span></td>
                    <td>
                      <span className="ap-type-badge" style={{ color: TYPE_COLORS[entry.type] || "#8899bb", borderColor: (TYPE_COLORS[entry.type] || "#8899bb") + "44", background: (TYPE_COLORS[entry.type] || "#8899bb") + "12" }}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="ap-td-title">{entry.title}</td>
                    <td className="ap-td-desc">{entry.description}</td>
                    <td className="ap-td-date">
                      {new Date(entry.date + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div className="ap-actions">
                        <button className="ap-btn-icon ap-btn-edit" onClick={() => openEdit(entry)} title="Editar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="ap-btn-icon ap-btn-del" onClick={() => setDeleteConfirm(entry.id)} title="Eliminar">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Add/Edit Modal ─────────────────────────────── */}
      {modal && (
        <div className="ap-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="ap-modal">
            <div className="ap-modal-header">
              <h3>{modal.mode === "add" ? "Nuevo Registro" : "Editar Registro"}</h3>
              <button className="ap-modal-close" onClick={closeModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="ap-modal-form">
              <div className="ap-form-row">
                <div className="ap-field">
                  <label>Versión</label>
                  <input type="text" placeholder="ej. v2.0.0" value={formData.version} onChange={e => setFormData(p => ({ ...p, version: e.target.value }))} />
                </div>
                <div className="ap-field">
                  <label>Fecha</label>
                  <input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                </div>
              </div>
              <div className="ap-field">
                <label>Tipo</label>
                <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="ap-field">
                <label>Título</label>
                <input type="text" placeholder="Título del cambio" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="ap-field">
                <label>Descripción</label>
                <textarea rows={4} placeholder="Descripción detallada del cambio..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="ap-modal-footer">
                <button type="button" className="ap-btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="ap-btn-primary" disabled={saving}>
                  {saving ? <span className="ap-spinner-sm" /> : (modal.mode === "add" ? "Publicar" : "Guardar Cambios")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────────── */}
      {deleteConfirm && (
        <div className="ap-modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="ap-modal ap-modal--sm">
            <div className="ap-modal-header">
              <h3>¿Eliminar registro?</h3>
            </div>
            <p className="ap-del-msg">Esta acción no se puede deshacer.</p>
            <div className="ap-modal-footer">
              <button className="ap-btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="ap-btn-danger" onClick={handleDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

