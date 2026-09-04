import React from "react";
import { Wallet, ShieldCheck, Award, AlertCircle } from "lucide-react";
import { getMaxBid } from "../engine/auctionEngine.js";

export default function MyRosterWidget({ myTeam, leagueSettings }) {
  if (!myTeam) return null;

  const roster = myTeam.roster || [];
  const maxBid = getMaxBid(myTeam);
  const emptySpots = myTeam.totalRosterSlots - roster.length;
  const spent = myTeam.spent || 0;
  const remainingBudget = myTeam.budget;

  const totalProjPts = roster.reduce((acc, p) => acc + (p.projPts || 0), 0);

  return (
    <div className="glass-card" style={{ padding: "1.2rem", marginBottom: "1.5rem" }}>
      
      {/* Header & Financial Metrics */}
      <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.8rem", marginBottom: "0.8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Wallet size={16} color="#3b82f6" /> MY ROSTER & CASH
          </h3>
          <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            ${remainingBudget} REMAINING
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: "0.6rem" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.4rem", borderRadius: "6px", textAlign: "center" }}>
            <span style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 700 }}>SPENT</span>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#cbd5e1", fontFamily: "var(--font-mono)" }}>
              ${spent}
            </p>
          </div>
          <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "0.4rem", borderRadius: "6px", textAlign: "center", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <span style={{ fontSize: "0.6rem", color: "#34d399", fontWeight: 700 }}>MAX BID</span>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#34d399", fontFamily: "var(--font-mono)" }}>
              ${maxBid}
            </p>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.4rem", borderRadius: "6px", textAlign: "center" }}>
            <span style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 700 }}>EMPTY SPOTS</span>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#cbd5e1", fontFamily: "var(--font-mono)" }}>
              {emptySpots}
            </p>
          </div>
        </div>
      </div>

      {/* Roster List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b", marginBottom: "0.4rem", fontWeight: 700 }}>
          <span>SLOT & PLAYER</span>
          <span>COST / PROJ</span>
        </div>

        {roster.length === 0 ? (
          <div style={{ padding: "1rem", textAlign: "center", color: "#64748b", fontSize: "0.8rem", fontStyle: "italic" }}>
            No players drafted yet. Your squad is waiting!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "280px", overflowY: "auto" }}>
            {roster.map((p, idx) => (
              <div
                key={`${p.id}-${idx}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.45rem 0.6rem",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.04)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className={`pos-badge pos-${p.pos}`}>{p.pos}</span>
                  <span style={{ fontWeight: 600, fontSize: "0.8rem", color: "#fff" }}>{p.name}</span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#34d399", fontFamily: "var(--font-mono)" }}>
                    ${p.cost}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: "0.4rem" }}>
                    {p.projPts} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {roster.length > 0 && (
          <div style={{ marginTop: "0.8rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
            <span style={{ color: "#94a3b8" }}>Projected Team Points:</span>
            <strong style={{ color: "#60a5fa", fontFamily: "var(--font-mono)" }}>{totalProjPts} pts</strong>
          </div>
        )}
      </div>

    </div>
  );
}
