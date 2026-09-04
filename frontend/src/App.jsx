import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";

import Header from "./components/Header.jsx";
import AuctionDashboard from "./components/AuctionDashboard.jsx";
import PlayerBoard from "./components/PlayerBoard.jsx";
import MyRosterWidget from "./components/MyRosterWidget.jsx";
import RivalTracker from "./components/RivalTracker.jsx";
import NominationAdvisorWidget from "./components/NominationAdvisorWidget.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import SleeperModal from "./components/SleeperModal.jsx";

import { DEFAULT_PLAYERS } from "./data/defaultPlayers.js";
import { calculateDynamicValues, calculateInflationIndex, getMaxBid } from "./engine/auctionEngine.js";
import { getAiBidDecision, AI_PERSONALITIES } from "./engine/mockSimulator.js";
import { sendSleeperAutoBid } from "./services/sleeperApi.js";

const DEFAULT_SETTINGS = {
  totalBudget: 200,
  numTeams: 12,
  totalRosterSlots: 15,
  isSuperflex: false,
  rosterRequirements: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPER_FLEX: 0, K: 1, DST: 1 }
};

export default function App() {
  const [leagueSettings, setLeagueSettings] = useState(DEFAULT_SETTINGS);
  const [mode, setMode] = useState("LIVE"); // "LIVE" or "MOCK"
  const [autoPilot, setAutoPilot] = useState(false); // Auto-Pilot Auto-Bidding
  const [strategyKey, setStrategyKey] = useState("BALANCED"); // "BALANCED", "STARS_AND_SCRUBS", "HERO_RB", "ZERO_RB"

  const createTeamsList = (numTeams, totalBudget, totalSlots) => {
    const arr = [];
    arr.push({
      id: "team-me",
      name: "My Team (User)",
      budget: totalBudget,
      spent: 0,
      totalRosterSlots: totalSlots,
      roster: [],
      strategy: "USER"
    });

    const strategies = Object.keys(AI_PERSONALITIES);
    for (let i = 1; i < numTeams; i++) {
      arr.push({
        id: `team-${i}`,
        name: `Rival Manager ${i}`,
        budget: totalBudget,
        spent: 0,
        totalRosterSlots: totalSlots,
        roster: [],
        strategy: strategies[i % strategies.length]
      });
    }
    return arr;
  };

  const [teams, setTeams] = useState(() => 
    createTeamsList(DEFAULT_SETTINGS.numTeams, DEFAULT_SETTINGS.totalBudget, DEFAULT_SETTINGS.totalRosterSlots)
  );

  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [activePlayer, setActivePlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highBidderId, setHighBidderId] = useState(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSleeperOpen, setIsSleeperOpen] = useState(false);

  // Calculate dynamic valuation taking into account inflation, superflex, & draft strategy
  const dynamicPlayers = calculateDynamicValues(players, teams, "team-me", leagueSettings, strategyKey);
  const inflationIndex = calculateInflationIndex(players, teams, leagueSettings);

  const activePlayerDynamic = activePlayer 
    ? dynamicPlayers.find(p => p.id === activePlayer.id) 
    : null;

  // Auto-Pilot Logic: Automatically places bids for user when active player bid is below max target
  useEffect(() => {
    if (!autoPilot || !activePlayerDynamic || highBidderId === "team-me") return;

    const myTeam = teams.find(t => t.id === "team-me");
    const myMaxBid = myTeam ? getMaxBid(myTeam) : 0;
    const nextBid = currentBid + 1;

    if (nextBid <= activePlayerDynamic.targetBidMax && nextBid <= myMaxBid) {
      const timer = setTimeout(() => {
        handlePlaceBid(nextBid, "team-me");
        sendSleeperAutoBid(leagueSettings.draftId, activePlayerDynamic, nextBid, null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [autoPilot, activePlayerDynamic, currentBid, highBidderId]);

  const handleSaveSettings = (newSettings) => {
    setLeagueSettings(newSettings);
    setTeams(createTeamsList(newSettings.numTeams || 12, newSettings.totalBudget || 200, newSettings.totalRosterSlots || 15));
  };

  const handleNominatePlayer = (player) => {
    setActivePlayer(player);
    setCurrentBid(1);
    setHighBidderId("team-me");
  };

  const handlePlaceBid = (newBid, bidderId) => {
    setCurrentBid(newBid);
    setHighBidderId(bidderId);
  };

  const handleCancelNomination = () => {
    setActivePlayer(null);
    setCurrentBid(0);
    setHighBidderId(null);
  };

  const handleCompletePick = (playerId, winnerTeamId, cost) => {
    const playerObj = players.find(p => p.id === playerId);
    if (!playerObj) return;

    setTeams(prevTeams => prevTeams.map(t => {
      if (t.id === winnerTeamId) {
        return {
          ...t,
          budget: Math.max(0, t.budget - cost),
          spent: (t.spent || 0) + cost,
          roster: [...t.roster, { ...playerObj, cost }]
        };
      }
      return t;
    }));

    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === playerId) {
        return { ...p, draftedBy: winnerTeamId, cost };
      }
      return p;
    }));

    if (winnerTeamId === "team-me") {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }

    setActivePlayer(null);
    setCurrentBid(0);
    setHighBidderId(null);
  };

  const handleAiStep = () => {
    if (!activePlayer) return;

    for (const team of teams) {
      if (team.id === "team-me") continue;
      const wantsToBid = getAiBidDecision(team, activePlayer, currentBid, highBidderId, leagueSettings);
      if (wantsToBid) {
        handlePlaceBid(currentBid + 1, team.id);
        return;
      }
    }
  };

  const handleResetDraft = () => {
    if (window.confirm("Are you sure you want to reset all draft picks and budgets?")) {
      setPlayers(DEFAULT_PLAYERS);
      setTeams(createTeamsList(leagueSettings.numTeams, leagueSettings.totalBudget, leagueSettings.totalRosterSlots));
      setActivePlayer(null);
      setCurrentBid(0);
      setHighBidderId(null);
    }
  };

  const handleImportSleeperLeague = (sleeperLeague) => {
    if (sleeperLeague) {
      const updatedSettings = {
        totalBudget: sleeperLeague.totalBudget || 200,
        numTeams: sleeperLeague.numTeams || 12,
        totalRosterSlots: sleeperLeague.totalRosterSlots || 15,
        isSuperflex: sleeperLeague.isSuperflex || false,
        rosterRequirements: sleeperLeague.rosterRequirements || DEFAULT_SETTINGS.rosterRequirements
      };

      setLeagueSettings(updatedSettings);
      setTeams(createTeamsList(updatedSettings.numTeams, updatedSettings.totalBudget, updatedSettings.totalRosterSlots));
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem 3rem" }}>
      
      <Header
        mode={mode}
        setMode={setMode}
        autoPilot={autoPilot}
        setAutoPilot={setAutoPilot}
        strategyKey={strategyKey}
        setStrategyKey={setStrategyKey}
        inflationIndex={inflationIndex}
        onReset={handleResetDraft}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSleeperModal={() => setIsSleeperOpen(true)}
      />

      {autoPilot && (
        <div className="glass-card pulse-active" style={{ padding: "0.6rem 1rem", marginBottom: "1rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.4)", display: "flex", alignItems: "center", justifyBetween: "center", gap: "0.5rem", borderRadius: "10px" }}>
          <span style={{ fontWeight: 800, color: "#34d399", fontSize: "0.85rem" }}>🤖 AUTO-PILOT BIDDING ACTIVE:</span>
          <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
            The bot will automatically place outbids for target players up to your calculated Max Target Price.
          </span>
        </div>
      )}

      {leagueSettings.isSuperflex && (
        <div className="glass-card" style={{ padding: "0.6rem 1rem", marginBottom: "1rem", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "10px" }}>
          <span style={{ fontWeight: 800, color: "#fbbf24", fontSize: "0.85rem" }}>⚡ SUPERFLEX FORMAT DETECTED:</span>
          <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
            QB auction valuations are dynamically boosted (1.85x multiplier) for 2-QB starting setups.
          </span>
        </div>
      )}

      <AuctionDashboard
        activePlayer={activePlayerDynamic}
        currentBid={currentBid}
        highBidderId={highBidderId}
        teams={teams}
        myTeamId="team-me"
        mode={mode}
        onPlaceBid={handlePlaceBid}
        onCompletePick={handleCompletePick}
        onCancelNomination={handleCancelNomination}
        onAiStep={handleAiStep}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Left Column: Player Board */}
        <div style={{ gridColumn: "span 2" }}>
          <PlayerBoard
            players={dynamicPlayers}
            onNominatePlayer={handleNominatePlayer}
            activePlayerId={activePlayer?.id}
          />
        </div>

        {/* Right Column: Roster & Nomination Assistant & Rivals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <MyRosterWidget
            myTeam={teams.find(t => t.id === "team-me")}
            leagueSettings={leagueSettings}
          />

          <NominationAdvisorWidget
            allPlayers={dynamicPlayers}
            teams={teams}
            myTeamId="team-me"
            leagueSettings={leagueSettings}
            onNominatePlayer={handleNominatePlayer}
          />

          <RivalTracker
            teams={teams}
            myTeamId="team-me"
          />
        </div>

      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={leagueSettings}
        onSaveSettings={handleSaveSettings}
      />

      <SleeperModal
        isOpen={isSleeperOpen}
        onClose={() => setIsSleeperOpen(false)}
        onImportSleeperLeague={handleImportSleeperLeague}
      />

    </div>
  );
}
