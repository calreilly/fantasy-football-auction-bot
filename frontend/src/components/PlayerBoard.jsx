import React, { useState } from "react";
import { Search, Filter, ArrowUpDown, DollarSign, Check, PlusCircle, Flame, AlertCircle, TrendingUp } from "lucide-react";
import { POSITIONS } from "../data/defaultPlayers.js";
import { getTierScarcity } from "../engine/auctionEngine.js";

export default function PlayerBoard({
  players,
  onNominatePlayer,
  activePlayerId
}) {
  const [selectedPos, setSelectedPos] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("dynamicValue");
  const [sortAsc, setSortAsc] = useState(false);
  const [hideDrafted, setHideDrafted] = useState(true);

  const scarcity = getTierScarcity(players);

  // Filter logic
  const filteredPlayers = players.filter(p => {
    if (hideDrafted && p.draftedBy) return false;
    if (selectedPos !== "ALL" && p.pos !== selectedPos) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort logic
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: "1.2rem", marginBottom: "1.5rem" }}>
      
      {/* Tier Scarcity Warnings Bar */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {["QB", "RB", "WR", "TE"].map(pos => {
          const t1Left = scarcity[pos]?.t1 || 0;
          if (t1Left > 0 && t1Left <= 2) {
            return (
              <div key={pos} style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fb7185", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <AlertCircle size={12} /> TIER 1 {pos} SCARCITY: Only {t1Left} left!
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        
        {/* Position Filter Pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {POSITIONS.map(pos => (
            <button
              key={pos}
              onClick={() => setSelectedPos(pos)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                border: selectedPos === pos ? "1px solid var(--accent-blue)" : "1px solid var(--border-color)",
                background: selectedPos === pos ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.03)",
                color: selectedPos === pos ? "#60a5fa" : "#94a3b8",
                fontWeight: 600,
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Search & Hide Drafted Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "200px" }}>
            <Search size={14} color="#64748b" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search player or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem 0.5rem 0.4rem 2rem",
                borderRadius: "8px",
                background: "#1e293b",
                border: "1px solid var(--border-color)",
                color: "#fff",
                fontSize: "0.8rem"
              }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#94a3b8", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={hideDrafted}
              onChange={(e) => setHideDrafted(e.target.checked)}
            />
            Hide Drafted
          </label>
        </div>

      </div>

      {/* Players Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase" }}>
              <th style={{ padding: "0.6rem", cursor: "pointer" }} onClick={() => handleSort("name")}>
                PLAYER <ArrowUpDown size={10} />
              </th>
              <th style={{ padding: "0.6rem", cursor: "pointer" }} onClick={() => handleSort("projPts")}>
                PROJ PTS <ArrowUpDown size={10} />
              </th>
              <th style={{ padding: "0.6rem", cursor: "pointer" }} onClick={() => handleSort("baselineAAV")}>
                BASE AAV <ArrowUpDown size={10} />
              </th>
              <th style={{ padding: "0.6rem", cursor: "pointer", color: "#60a5fa" }} onClick={() => handleSort("dynamicValue")}>
                DYNAMIC VAL <ArrowUpDown size={10} />
              </th>
              <th style={{ padding: "0.6rem" }}>TARGET RANGE</th>
              <th style={{ padding: "0.6rem" }}>VALUE BADGE</th>
              <th style={{ padding: "0.6rem", textAlign: "right" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map(p => {
              const isActive = p.id === activePlayerId;
              const isDrafted = !!p.draftedBy;
              const diff = (p.dynamicValue || 0) - (p.baselineAAV || 0);

              return (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    background: isActive ? "rgba(59, 130, 246, 0.1)" : "transparent",
                    transition: "background 0.2s"
                  }}
                >
                  {/* Player info */}
                  <td style={{ padding: "0.6rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className={`pos-badge pos-${p.pos}`}>{p.pos}</span>
                      <div>
                        <span style={{ fontWeight: 700, color: isDrafted ? "#64748b" : "#fff", fontSize: "0.85rem" }}>
                          {p.name}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: "0.4rem" }}>
                          {p.team} • T{p.tier}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Proj Pts */}
                  <td style={{ padding: "0.6rem", fontSize: "0.85rem", color: "#cbd5e1", fontFamily: "var(--font-mono)" }}>
                    {p.projPts}
                  </td>

                  {/* Baseline AAV */}
                  <td style={{ padding: "0.6rem", fontSize: "0.85rem", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                    ${p.baselineAAV}
                  </td>

                  {/* Dynamic Value */}
                  <td style={{ padding: "0.6rem", fontSize: "0.9rem", fontWeight: 700, color: "#60a5fa", fontFamily: "var(--font-mono)" }}>
                    ${p.dynamicValue}
                  </td>

                  {/* Target Range */}
                  <td style={{ padding: "0.6rem", fontSize: "0.8rem", color: "#34d399", fontFamily: "var(--font-mono)" }}>
                    ${p.targetBidMin} - ${p.targetBidMax}
                  </td>

                  {/* Value Badge */}
                  <td style={{ padding: "0.6rem" }}>
                    {diff > 0 ? (
                      <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        <Flame size={10} /> +${diff} Bargain
                      </span>
                    ) : diff < 0 ? (
                      <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "4px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        <TrendingUp size={10} /> -${Math.abs(diff)} Inflated
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Fair</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "0.6rem", textAlign: "right" }}>
                    {isDrafted ? (
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                        Drafted (${p.cost})
                      </span>
                    ) : (
                      <div style={{ display: "flex", gap: "0.3rem", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => onNominatePlayer(p)}
                          style={{
                            padding: "0.3rem 0.6rem",
                            borderRadius: "6px",
                            border: "1px solid rgba(59, 130, 246, 0.4)",
                            background: "rgba(59, 130, 246, 0.15)",
                            color: "#60a5fa",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Nominate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
