import React, { useState } from "react";
import { X, Users, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { getSleeperUser, getUserLeagues } from "../services/sleeperApi.js";

export default function SleeperModal({ isOpen, onClose, onImportSleeperLeague }) {
  if (!isOpen) return null;

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);

  const handleFetchUser = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const user = await getSleeperUser(username.trim());
      const userLeagues = await getUserLeagues(user.user_id, "2025");
      setLeagues(userLeagues);
      if (userLeagues.length === 0) {
        setError("No Sleeper leagues found for season 2025/2026.");
      }
    } catch (err) {
      setError("Failed to fetch Sleeper account or leagues. Please check the username.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLeague = (lg) => {
    setSelectedLeague(lg);
    onImportSleeperLeague(lg);
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
      <div className="glass-card" style={{ width: "100%", maxWidth: "480px", padding: "1.5rem" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.6rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Users size={18} color="#3b82f6" /> SLEEPER LEAGUE SYNC
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleFetchUser} style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "0.3rem" }}>
            SLEEPER USERNAME
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="e.g. fantasychamp99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                flex: 1,
                padding: "0.45rem",
                borderRadius: "6px",
                background: "#1e293b",
                border: "1px solid var(--border-color)",
                color: "#fff",
                fontSize: "0.85rem"
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "6px",
                border: "none",
                background: "var(--accent-blue)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem"
              }}
            >
              {loading ? <RefreshCw size={14} className="pulse-active" /> : "Fetch Leagues"}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ padding: "0.6rem", borderRadius: "6px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {leagues.length > 0 && (
          <div>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
              SELECT LEAGUE TO IMPORT
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "200px", overflowY: "auto" }}>
              {leagues.map(lg => (
                <div
                  key={lg.league_id}
                  onClick={() => handleSelectLeague(lg)}
                  style={{
                    padding: "0.6rem",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.2s"
                  }}
                >
                  <div>
                    <strong style={{ color: "#fff", fontSize: "0.85rem" }}>{lg.name}</strong>
                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "block" }}>
                      {lg.total_rosters} Teams • {lg.status}
                    </span>
                  </div>
                  <CheckCircle2 size={16} color="#3b82f6" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
