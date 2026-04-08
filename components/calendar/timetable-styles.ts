// ═══════════════════════════════════════
// TIMETABLE STYLES
// ═══════════════════════════════════════

export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.tt-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

/* Header */
.tt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: white;
  flex-wrap: wrap;
  gap: 12px;
}

/* Role Switcher */
.tt-role-switcher {
  display: flex;
  gap: 4px;
  background: #f8fafc;
  padding: 4px;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
}
.tt-role-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  color: #94a3b8;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: transparent;
}
.tt-role-btn:hover {
  color: #475569;
  background: white;
}
.tt-role-active {
  color: white !important;
  background: #1e293b !important;
  box-shadow: 0 4px 12px -2px rgba(30, 41, 59, 0.25);
}

/* Body */
.tt-body {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f8fafc;
}

/* Cards */
.tt-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  transition: all 0.2s ease;
}

/* Tabs */
.tt-tabs {
  display: flex;
  gap: 4px;
  background: #f8fafc;
  padding: 4px;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
  width: fit-content;
}
.tt-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  color: #94a3b8;
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.2s ease;
}
.tt-tab:hover { color: #475569; background: white; }
.tt-tab-active {
  color: #1e293b !important;
  background: white !important;
  box-shadow: 0 2px 8px -2px rgba(0,0,0,0.08);
}

/* Form Elements */
.tt-select {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #334155;
  outline: none;
  transition: all 0.15s;
  cursor: pointer;
}
.tt-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.tt-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #334155;
  outline: none;
  transition: all 0.15s;
}
.tt-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.tt-input::placeholder { color: #cbd5e1; }
.tt-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 6px;
}

/* Buttons */
.tt-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px -2px rgba(59,130,246,0.35);
}
.tt-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px -2px rgba(59,130,246,0.4); }
.tt-btn-primary:active { transform: translateY(0); }
.tt-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.tt-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.tt-btn-secondary:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
.tt-btn-secondary:active { transform: translateY(0); background: #f1f5f9; }
.tt-btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  cursor: pointer;
  transition: all 0.2s;
}
.tt-btn-danger:hover { background: #fee2e2; }
.tt-btn-ghost {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  color: #64748b;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}
.tt-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

/* Grid */
.grid-corner {
  background: #fafbfc;
  border-bottom: 2px solid #cbd5e1;
  border-right: 1.5px solid #e2e8f0;
  border-radius: 16px 0 0 0;
}
.grid-day-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 8px;
  background: #fafbfc;
  border-bottom: 2px solid #cbd5e1;
  border-right: 1.5px solid #e2e8f0;
}
.grid-day-header:last-child {
  border-radius: 0 16px 0 0;
}
.grid-time {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2px;
  padding: 8px;
  border-bottom: 1.5px solid #e2e8f0;
  border-right: 1.5px solid #e2e8f0;
  min-height: 88px;
  background: #fafbfc;
}
.grid-cell-empty {
  border-bottom: 1.5px solid #e2e8f0;
  border-right: 1.5px solid #e2e8f0;
  min-height: 88px;
  transition: background 0.2s;
}
.grid-cell-empty:hover {
  background: #f0f9ff;
}
.grid-cell-filled {
  border-bottom: 1.5px solid #e2e8f0;
  border-right: 1.5px solid #e2e8f0;
  min-height: 88px;
  padding: 4px;
}

/* Slot Block (legacy) */
.slot-block {
  position: relative;
  display: flex;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, var(--slot-color) 4%, white);
  border: 1px solid color-mix(in srgb, var(--slot-color) 15%, transparent);
  transition: all 0.2s;
  padding: 10px 12px;
  cursor: pointer;
}
.slot-block:hover {
  background: color-mix(in srgb, var(--slot-color) 6%, white);
  box-shadow: 0 4px 12px -2px color-mix(in srgb, var(--slot-color) 20%, transparent);
  transform: translateY(-2px);
}
.slot-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  width: 100%;
}
.slot-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.slot-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--slot-color) 30%, transparent);
  color: var(--slot-color);
}
.slot-code {
  font-size: 13px;
  font-weight: 800;
  color: var(--slot-color);
  opacity: 0.9;
}
.slot-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--slot-color);
  margin-bottom: 2px;
}
.slot-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background: #f8fafc;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: 2px;
}
.slot-meta {
  font-size: 13px;
  color: #64748b;
  font-weight: 400;
  margin-bottom: 2px;
}
.slot-room {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748b;
  font-weight: 400;
  margin-top: auto;
}

/* Slide Down Animation */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
  }
}
.animate-slideDown {
  animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  overflow: hidden;
}

/* Today Column Highlight */
.today-col-header {
  background: linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%) !important;
  border-bottom-color: #93C5FD !important;
  position: relative;
}
.today-col-cell {
  background: #F0F7FF;
}

/* Mini Calendar */
.mini-cal-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 12px 40px -8px rgba(0,0,0,0.15), 0 4px 12px -4px rgba(0,0,0,0.08);
  width: 260px;
  animation: miniCalIn 0.2s ease-out;
}
@keyframes miniCalIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.97); }
  to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

/* Confetti */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}
.confetti-piece {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confettiFall 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
@keyframes confettiFall {
  0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg) scale(0.3); opacity: 0; }
}

/* Print Styles */
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { background: white !important; }
  .tt-root { min-height: auto !important; }
  .tt-header { padding: 12px 16px !important; border-bottom: 2px solid #1e293b !important; }
  .tt-role-switcher, .tt-btn-primary, .tt-btn-secondary, .tt-btn-danger, .tt-btn-ghost,
  .tt-tabs, .animate-slideDown, .confetti-container { display: none !important; }
  .tt-body { padding: 12px !important; background: white !important; }
  .tt-card { box-shadow: none !important; border: 1px solid #cbd5e1 !important; break-inside: avoid; }
  .grid-cell-filled { break-inside: avoid; }
  .grid-cell-empty:hover { background: transparent !important; }
  .slot-block:hover { transform: none !important; box-shadow: none !important; }
  select, button { display: none !important; }
  .tt-select { display: none !important; }
  h1::after { content: ' — Printed Schedule'; font-size: 12px; font-weight: 400; color: #64748b; }
}
`;
