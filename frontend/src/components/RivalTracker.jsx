import React from "react";
import { Users, Shield, Zap } from "lucide-react";
import { getMaxBid } from "../engine/auctionEngine.js";

export default function RivalTracker({ teams, myTeamId }) {
  const rivals = teams.filter(t => t.id !== myTeamId);

  return (
    <div className="glass-card" style={{ padding: "1.2rem", marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.8rem" }}>
        <Users size={16} color="#8b5cf6" /> RIVAL CASH & THREAT TRACKER
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
        {rivals.map(r => {
          const maxBid = getMaxBid(r);
          const rosterCount = r.roster ? r.roster.length : 0;
          const openSpots = r.totalRosterSlots - rosterCount;

          const posBreakdown = {
            QB: (r.roster || []).filter(p => p.pos === "QB").length,
            RB: (r.roster || []).filter(p => p.pos === "RB").length,
            WR: (r.roster || []).filter(p => p.pos === "WR").length,
            TE: (r.roster || []).filter(p => p.pos === "TE").length,
          };

          return (
            <div
              key={r.id}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-color)",
                borderRadius: "10px",
                padding: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>
                  {r.name}
                </span>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(139, 92, 246, 0.15)", color: "#c084fc", fontWeight: 600 }}>
                  {r.strategy || "Balanced"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "0.2rem" }}>
                <div>
                  <span style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 700 }}>REMAINING</span>
                  <p style={{ fontSize: "1rem", fontWeight: 700, color: "#34d399", fontFamily: "var(--font-mono)" }}>
                    ${r.budget}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 700 }}>MAX BID</span>
                  <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#60a5fa", fontFamily: "var(--font-mono)" }}>
                    ${maxBid}
                  </p>
                </div>
              </div>

              {/* Roster counts */}
              <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.3rem", fontSize: "0.65rem", color: "#94a3b8" }}>
                <span>QB: {posBreakdown.QB}</span> •
                <span>RB: {posBreakdown.RB}</span> •
                <span>WR: {posBreakdown.WR}</span> •
                <span>TE: {posBreakdown.TE}</span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
