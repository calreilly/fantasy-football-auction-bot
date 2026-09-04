import React from "react";
import { X, Award, Trophy, TrendingUp, Flame, CheckCircle2 } from "lucide-react";
import { calculateDraftGrades } from "../engine/mockSimulator.js";

export default function DraftGradeModal({ isOpen, onClose, teams, players }) {
  if (!isOpen) return null;

  const results = calculateDraftGrades(teams, players);
  const { grade, userRank, standings, steals, overpays, userTeam } = results;

  const getGradeColor = (g) => {
    if (g === "A+" || g === "A") return "#34d399";
    if (g === "B+" || g === "B") return "#60a5fa";
    return "#fbbf24";
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem"
    }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "800px", padding: "1.8rem", maxHeight: "90vh", overflowY: "auto" }}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.8rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Trophy size={24} color="#f59e0b" /> MOCK DRAFT RESULTS & GRADE
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>

        {/* Grade Banner */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))",
          border: `1px solid ${getGradeColor(grade)}50`,
          borderRadius: "14px",
          padding: "1.2rem",
          marginBottom: "1.5rem"
        }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>YOUR DRAFT GRADE</span>
            <h3 style={{ fontSize: "2.5rem", fontWeight: 900, color: getGradeColor(grade), fontFamily: "var(--font-mono)", lineHeight: "1" }}>
              {grade}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.3rem" }}>
              Ranked <strong>#{userRank} of {teams.length}</strong> with <strong>{userTeam?.totalPts}</strong> projected total points.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>SURPLUS VALUE CAPTURED</span>
            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399", fontFamily: "var(--font-mono)" }}>
              +${userTeam?.surplusValue}
            </p>
          </div>
        </div>

        {/* League Standings Table */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: "0.6rem" }}>
            📊 League Standings Projection
          </h4>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "#64748b", textTransform: "uppercase", fontSize: "0.65rem" }}>
                <th style={{ padding: "0.5rem" }}>RANK & TEAM</th>
                <th style={{ padding: "0.5rem" }}>PROJ PTS</th>
                <th style={{ padding: "0.5rem" }}>SPENT ($)</th>
                <th style={{ padding: "0.5rem" }}>SURPLUS VALUE</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => (
                <tr
                  key={s.teamId}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    background: s.teamId === "team-me" ? "rgba(59, 130, 246, 0.15)" : "transparent"
                  }}
                >
                  <td style={{ padding: "0.5rem", fontWeight: 700, color: s.teamId === "team-me" ? "#60a5fa" : "#fff" }}>
                    #{idx + 1} {s.name}
                  </td>
                  <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#cbd5e1" }}>
                    {s.totalPts} pts
                  </td>
                  <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)", color: "#94a3b8" }}>
                    ${s.totalSpent}
                  </td>
                  <td style={{ padding: "0.5rem", fontFamily: "var(--font-mono)", fontWeight: 700, color: s.surplusValue >= 0 ? "#34d399" : "#f87171" }}>
                    {s.surplusValue >= 0 ? `+$${s.surplusValue}` : `-$${Math.abs(s.surplusValue)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Best Bargain Steals & Overpays Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          
          {/* Steals */}
          <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "10px", padding: "0.8rem" }}>
            <h5 style={{ fontSize: "0.8rem", fontWeight: 800, color: "#34d399", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.5rem" }}>
              <Flame size={14} /> TOP BARGAIN STEALS
            </h5>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.75rem" }}>
              {steals.map((p, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.04)", paddingBottom: "0.2rem" }}>
                  <span>{p.name} ({p.pos})</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#34d399", fontWeight: 700 }}>
                    Cost: ${p.cost} (Base: ${p.baselineAAV})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overpays */}
          <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "10px", padding: "0.8rem" }}>
            <h5 style={{ fontSize: "0.8rem", fontWeight: 800, color: "#f87171", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.5rem" }}>
              <TrendingUp size={14} /> TOP OVERPAYS IN ROOM
            </h5>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.75rem" }}>
              {overpays.map((p, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.04)", paddingBottom: "0.2rem" }}>
                  <span>{p.name} ({p.pos})</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#f87171", fontWeight: 700 }}>
                    Paid: ${p.cost} (+${p.overpay})
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
