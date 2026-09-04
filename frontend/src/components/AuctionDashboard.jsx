import React, { useState, useEffect } from "react";
import { DollarSign, CheckCircle2, TrendingUp, AlertTriangle, Play, ShieldAlert, Award } from "lucide-react";
import { getMaxBid } from "../engine/auctionEngine.js";

export default function AuctionDashboard({
  activePlayer,
  currentBid,
  highBidderId,
  teams,
  myTeamId,
  mode,
  onPlaceBid,
  onCompletePick,
  onCancelNomination,
  onAiStep
}) {
  const [winningTeamId, setWinningTeamId] = useState(highBidderId || teams[0]?.id);
  const [finalPrice, setFinalPrice] = useState(currentBid);

  useEffect(() => {
    setWinningTeamId(highBidderId || teams[0]?.id);
    setFinalPrice(currentBid);
  }, [activePlayer, currentBid, highBidderId, teams]);

  if (!activePlayer) {
    return (
      <div className="glass-card" style={{ padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
        <div style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          background: "rgba(59, 130, 246, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1rem"
        }}>
          <DollarSign size={28} color="#3b82f6" />
        </div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", marginBottom: "0.4rem" }}>
          No Active Nomination
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem", maxWidth: "500px", margin: "0 auto" }}>
          Select a player from the Player Board below or view strategic recommendations from the Nomination Advisor to begin the bidding round.
        </p>
      </div>
    );
  }

  const myTeam = teams.find(t => t.id === myTeamId);
  const myMaxBid = myTeam ? getMaxBid(myTeam) : 0;

  const isBargain = activePlayer.dynamicValue > activePlayer.baselineAAV;
  const isOverpriced = currentBid > activePlayer.targetBidMax;

  return (
    <div className="glass-card pulse-active" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", alignItems: "center" }}>
        
        {/* Nominated Player Details */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            <span className={`pos-badge pos-${activePlayer.pos}`}>{activePlayer.pos}</span>
            <span className="tier-badge">Tier {activePlayer.tier}</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{activePlayer.team} • Bye Wk {activePlayer.bye}</span>
          </div>

          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", lineHeight: "1.2" }}>
            {activePlayer.name}
          </h2>

          <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.3rem", fontStyle: "italic" }}>
            "{activePlayer.notes}"
          </p>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>BASELINE AAV</span>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#cbd5e1", fontFamily: "var(--font-mono)" }}>
                ${activePlayer.baselineAAV}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "0.65rem", color: "#3b82f6", textTransform: "uppercase", fontWeight: 700 }}>DYNAMIC VAL</span>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#60a5fa", fontFamily: "var(--font-mono)" }}>
                ${activePlayer.dynamicValue}
              </p>
            </div>
            <div>
              <span style={{ fontSize: "0.65rem", color: "#10b981", textTransform: "uppercase", fontWeight: 700 }}>MAX RECOMMENDED</span>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#34d399", fontFamily: "var(--font-mono)" }}>
                ${activePlayer.targetBidMax}
              </p>
            </div>
          </div>
        </div>

        {/* Live Bidding Box */}
        <div style={{ background: "rgba(0, 0, 0, 0.3)", padding: "1.2rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>CURRENT HIGH BID</span>
            {isOverpriced && (
              <span style={{ fontSize: "0.7rem", color: "#f87171", display: "flex", alignItems: "center", gap: "0.2rem", fontWeight: 600 }}>
                <AlertTriangle size={12} /> Exceeds Max Target!
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.8rem" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#34d399", fontFamily: "var(--font-mono)", lineHeight: "1" }}>
              ${currentBid}
            </span>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              held by <strong style={{ color: highBidderId === myTeamId ? "#3b82f6" : "#fff" }}>
                {teams.find(t => t.id === highBidderId)?.name || "None"}
              </strong>
            </span>
          </div>

          {/* Quick Bid Actions */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => onPlaceBid(currentBid + 1, myTeamId)}
              disabled={currentBid + 1 > myMaxBid}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                opacity: currentBid + 1 > myMaxBid ? 0.5 : 1
              }}
            >
              Bid +$1 (${currentBid + 1})
            </button>
            <button
              onClick={() => onPlaceBid(currentBid + 5, myTeamId)}
              disabled={currentBid + 5 > myMaxBid}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                opacity: currentBid + 5 > myMaxBid ? 0.5 : 1
              }}
            >
              Bid +$5 (${currentBid + 5})
            </button>
          </div>

          {mode === "MOCK" && (
            <button
              onClick={onAiStep}
              style={{
                width: "100%",
                padding: "0.45rem",
                marginBottom: "1rem",
                borderRadius: "8px",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                background: "rgba(139, 92, 246, 0.15)",
                color: "#c084fc",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem"
              }}
            >
              <Play size={14} /> Step AI Rival Bids
            </button>
          )}

          {/* Finalize Pick Form */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.8rem", marginTop: "0.4rem" }}>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.4rem" }}>
              FINALIZE WINNING BID
            </span>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
              <select
                value={winningTeamId}
                onChange={(e) => setWinningTeamId(e.target.value)}
                style={{
                  flex: 2,
                  padding: "0.45rem",
                  borderRadius: "6px",
                  background: "#1e293b",
                  border: "1px solid var(--border-color)",
                  color: "#fff",
                  fontSize: "0.8rem"
                }}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (${t.budget} left)</option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={finalPrice}
                onChange={(e) => setFinalPrice(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: "0.45rem",
                  borderRadius: "6px",
                  background: "#1e293b",
                  border: "1px solid var(--border-color)",
                  color: "#34d399",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  width: "60px",
                  fontFamily: "var(--font-mono)"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => onCompletePick(activePlayer.id, winningTeamId, finalPrice)}
                style={{
                  flex: 2,
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem"
                }}
              >
                <CheckCircle2 size={14} /> DRAFT PLAYER
              </button>
              <button
                onClick={onCancelNomination}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
