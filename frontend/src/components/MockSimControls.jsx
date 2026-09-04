import React from "react";
import { Play, Pause, FastForward, SkipForward, Award, Terminal, Zap } from "lucide-react";

export default function MockSimControls({
  simStatus, // "IDLE", "RUNNING", "PAUSED", "FINISHED"
  simSpeed, // 2000, 1000, 300, 0
  setSimSpeed,
  onStartSim,
  onPauseSim,
  onStepSim,
  onInstantSim,
  draftLog,
  onViewGrades
}) {
  return (
    <div className="glass-card" style={{ padding: "1rem", marginBottom: "1.5rem", border: "1px solid rgba(139, 92, 246, 0.4)", background: "rgba(139, 92, 246, 0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#c084fc", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Zap size={16} /> AI MOCK SIMULATOR
          </span>

          {simStatus === "RUNNING" ? (
            <button
              onClick={onPauseSim}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "none",
                background: "rgba(239, 68, 68, 0.2)",
                color: "#f87171",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem"
              }}
            >
              <Pause size={14} /> Pause Sim
            </button>
          ) : (
            <button
              onClick={onStartSim}
              disabled={simStatus === "FINISHED"}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                opacity: simStatus === "FINISHED" ? 0.5 : 1
              }}
            >
              <Play size={14} /> Run AI Mock
            </button>
          )}

          <button
            onClick={onStepSim}
            disabled={simStatus === "FINISHED"}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#cbd5e1",
              fontWeight: 600,
              fontSize: "0.75rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem"
            }}
          >
            <SkipForward size={14} /> Step Pick
          </button>

          <button
            onClick={onInstantSim}
            disabled={simStatus === "FINISHED"}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              fontWeight: 700,
              fontSize: "0.75rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem"
            }}
          >
            <FastForward size={14} /> Instant Sim
          </button>
        </div>

        {/* Speed Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>Speed:</span>
          {[
            { label: "1.5s", val: 1500 },
            { label: "0.5s", val: 500 },
            { label: "Fast", val: 150 }
          ].map(spd => (
            <button
              key={spd.label}
              onClick={() => setSimSpeed(spd.val)}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "6px",
                border: simSpeed === spd.val ? "1px solid #c084fc" : "1px solid var(--border-color)",
                background: simSpeed === spd.val ? "rgba(139, 92, 246, 0.3)" : "rgba(255, 255, 255, 0.03)",
                color: simSpeed === spd.val ? "#fff" : "#94a3b8",
                fontSize: "0.7rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {spd.label}
            </button>
          ))}
        </div>

        {/* Analytics Modal trigger */}
        {simStatus === "FINISHED" && (
          <button
            onClick={onViewGrades}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem"
            }}
          >
            <Award size={16} /> VIEW DRAFT GRADES & STANDINGS
          </button>
        )}

      </div>

      {/* Live Play-by-Play Log Feed */}
      {draftLog.length > 0 && (
        <div style={{ marginTop: "0.8rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.65rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem" }}>
            <Terminal size={12} /> LIVE AUCTION FEED
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#cbd5e1", maxHeight: "60px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            {draftLog.slice(-3).reverse().map((log, idx) => (
              <div key={idx} style={{ opacity: idx === 0 ? 1 : 0.6 }}>
                ▶ {log}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
