import React from "react";
import { Lightbulb, Flame, Target, ShieldAlert, ArrowRight } from "lucide-react";
import { getNominationRecommendations } from "../engine/nominationAdvisor.js";

export default function NominationAdvisorWidget({
  allPlayers,
  teams,
  myTeamId,
  leagueSettings,
  onNominatePlayer
}) {
  const recommendations = getNominationRecommendations(allPlayers, teams, myTeamId, leagueSettings);

  if (recommendations.length === 0) return null;

  return (
    <div className="glass-card" style={{ padding: "1.2rem", marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.8rem" }}>
        <Lightbulb size={16} color="#f59e0b" /> NOMINATION STRATEGY ASSISTANT
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(245, 158, 11, 0.05)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "10px",
              padding: "0.8rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {rec.title}
                </span>
                <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: "4px", background: "rgba(245, 158, 11, 0.2)", color: "#fef08a", fontWeight: 600 }}>
                  {rec.priority} Priority
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span className={`pos-badge pos-${rec.player.pos}`}>{rec.player.pos}</span>
                <strong style={{ fontSize: "0.9rem", color: "#fff" }}>{rec.player.name}</strong>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                  (${rec.player.baselineAAV})
                </span>
              </div>

              <p style={{ fontSize: "0.75rem", color: "#cbd5e1", lineHeight: "1.3", marginBottom: "0.8rem" }}>
                {rec.reason}
              </p>
            </div>

            <button
              onClick={() => onNominatePlayer(rec.player)}
              style={{
                width: "100%",
                padding: "0.4rem",
                borderRadius: "6px",
                border: "none",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.3rem"
              }}
            >
              Nominate {rec.player.name} <ArrowRight size={12} />
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}
