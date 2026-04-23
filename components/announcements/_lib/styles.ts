export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.ab-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.ab-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  transition: all 0.2s ease;
}
.ab-card:hover {
  box-shadow: 0 4px 20px -4px rgba(0,0,0,0.06);
}

.ab-card-enter {
  animation: abCardIn 0.4s ease-out both;
}
@keyframes abCardIn {
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.ab-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid;
  white-space: nowrap;
}

.ab-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e293b, #334155);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px -2px rgba(30,41,59,0.25);
}
.ab-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px -2px rgba(30,41,59,0.35); }
.ab-btn-primary:active { transform: translateY(0); }
.ab-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.ab-btn-ghost {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  color: #64748b;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}
.ab-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

.ab-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 12px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  cursor: pointer;
  transition: all 0.2s;
}
.ab-btn-danger:hover { background: #fee2e2; }

.ab-btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
}

.ab-input {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #334155;
  outline: none;
  transition: all 0.15s;
}
.ab-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.ab-input::placeholder { color: #94a3b8; }

.ab-select {
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #334155;
  outline: none;
  transition: all 0.15s;
  cursor: pointer;
  appearance: auto;
}
.ab-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.ab-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 6px;
}

.ab-filter-chip {
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s;
}
.ab-filter-chip:hover { background: #f8fafc; border-color: #cbd5e1; color: #334155; }
.ab-filter-chip-active {
  background: #1e293b !important;
  color: white !important;
  border-color: #1e293b !important;
  box-shadow: 0 2px 8px -2px rgba(30,41,59,0.3);
}

.ab-modal {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 25px 60px -12px rgba(0,0,0,0.25);
  animation: abModalIn 0.25s ease-out;
}
@keyframes abModalIn {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
`;
