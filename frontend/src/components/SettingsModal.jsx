import React, { useState } from "react";
import { X, Save, Sliders, Zap } from "lucide-react";

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    ...settings,
    rosterRequirements: {
      QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPER_FLEX: 0, K: 1, DST: 1,
      ...(settings.rosterRequirements || {})
    }
  });

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleReqChange = (pos, val) => {
    setForm(prev => ({
      ...prev,
      rosterRequirements: {
        ...prev.rosterRequirements,
        [pos]: Number(val)
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(form);
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem"
    }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "540px", padding: "1.5rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.6rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Sliders size={18} color="#3b82f6" /> LEAGUE SETTINGS & RULES
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                BUDGET ($)
              </label>
              <input
                type="number"
                min="50"
                max="1000"
                value={form.totalBudget}
                onChange={(e) => handleChange("totalBudget", Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.45rem",
                  borderRadius: "6px",
                  background: "#1e293b",
                  border: "1px solid var(--border-color)",
                  color: "#34d399",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                NUMBER OF TEAMS
              </label>
              <select
                value={form.numTeams}
                onChange={(e) => handleChange("numTeams", Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.45rem",
                  borderRadius: "6px",
                  background: "#1e293b",
                  border: "1px solid var(--border-color)",
                  color: "#fff"
                }}
              >
                <option value={8}>8 Teams</option>
                <option value={10}>10 Teams</option>
                <option value={12}>12 Teams</option>
                <option value={14}>14 Teams</option>
                <option value={16}>16 Teams</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
                TOTAL SPOTS
              </label>
              <input
                type="number"
                min="10"
                max="30"
                value={form.totalRosterSlots || 15}
                onChange={(e) => handleChange("totalRosterSlots", Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "0.45rem",
                  borderRadius: "6px",
                  background: "#1e293b",
                  border: "1px solid var(--border-color)",
                  color: "#fff"
                }}
              />
            </div>
          </div>

          {/* Superflex Rule Toggle */}
          <div style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "8px",
            padding: "0.6rem 0.8rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={18} color="#fbbf24" />
              <div>
                <strong style={{ fontSize: "0.85rem", color: "#fff" }}>Superflex League Format</strong>
                <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block" }}>
                  Boosts QB auction valuations for 2-QB / Q/W/R/T starting slots
                </span>
              </div>
            </div>

            <input
              type="checkbox"
              checked={form.isSuperflex || false}
              onChange={(e) => handleChange("isSuperflex", e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>
              STARTING ROSTER REQUIREMENTS
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {["QB", "RB", "WR", "TE", "FLEX", "SUPER_FLEX", "K", "DST"].map(pos => (
                <div key={pos} style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.4rem", borderRadius: "6px", textAlign: "center" }}>
                  <span className={`pos-badge pos-${pos === 'SUPER_FLEX' || pos === 'FLEX' ? 'WR' : pos}`} style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem", marginBottom: "0.3rem" }}>{pos}</span>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={form.rosterRequirements[pos] || 0}
                    onChange={(e) => handleReqChange(pos, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.25rem",
                      borderRadius: "4px",
                      background: "#1e293b",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      textAlign: "center"
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="submit"
              style={{
                flex: 2,
                padding: "0.55rem",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem"
              }}
            >
              <Save size={16} /> Save League Rules
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.55rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "transparent",
                color: "#94a3b8",
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
