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
import { calculateDynamicValues, calculateInflationIndex } from "./engine/auctionEngine.js";
import { getAiBidDecision, getAiNomination, AI_PERSONALITIES } from "./engine/mockSimulator.js";

const DEFAULT_SETTINGS = {
  totalBudget: 200,
  numTeams: 12,
  rosterRequirements: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 }
};

export default function App() {
  const [leagueSettings, setLeagueSettings] = useState(DEFAULT_SETTINGS);
  const [mode, setMode] = useState("LIVE"); // "LIVE" or "MOCK"
  
  // Teams setup
  const [teams, setTeams] = useState(() => {
    const arr = [];
    arr.push({
      id: "team-me",
      name: "My Team (User)",
      budget: 200,
      spent: 0,
      totalRosterSlots: 15,
      roster: [],
      strategy: "USER"
    });

    const strategies = Object.keys(AI_PERSONALITIES);
    for (let i = 1; i <= 11; i++) {
      arr.push({
        id: `team-${i}`,
        name: `Rival Manager ${i}`,
        budget: 200,
        spent: 0,
        totalRosterSlots: 15,
        roster: [],
        strategy: strategies[i % strategies.length]
      });
    }
    return arr;
  });

  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [activePlayer, setActivePlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highBidderId, setHighBidderId] = useState(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSleeperOpen, setIsSleeperOpen] = useState(false);

  // Calculate dynamic valuation on every state change
  const dynamicPlayers = calculateDynamicValues(players, teams, "team-me", leagueSettings);
  const inflationIndex = calculateInflationIndex(players, teams, leagueSettings);

  const activePlayerDynamic = activePlayer 
    ? dynamicPlayers.find(p => p.id === activePlayer.id) 
    : null;

  // Handlers
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

    // Update teams
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

    // Mark player as drafted
    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === playerId) {
        return { ...p, draftedBy: winnerTeamId, cost };
      }
      return p;
    }));

    // Trigger celebratory confetti if user drafted player
    if (winnerTeamId === "team-me") {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }

    // Clear active
    setActivePlayer(null);
    setCurrentBid(0);
    setHighBidderId(null);
  };

  // Step AI rival bids in MOCK mode
  const handleAiStep = () => {
    if (!activePlayer) return;

    // Check if any AI manager wants to bid higher than currentBid
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
      setTeams(prevTeams => prevTeams.map(t => ({
        ...t,
        budget: leagueSettings.totalBudget,
        spent: 0,
        roster: []
      })));
      setActivePlayer(null);
      setCurrentBid(0);
      setHighBidderId(null);
    }
  };

  const handleImportSleeperLeague = (sleeperLeague) => {
    if (sleeperLeague && sleeperLeague.total_rosters) {
      setLeagueSettings(prev => ({
        ...prev,
        numTeams: sleeperLeague.total_rosters
      }));
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem 3rem" }}>
      
      <Header
        mode={mode}
        setMode={setMode}
        inflationIndex={inflationIndex}
        onReset={handleResetDraft}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSleeperModal={() => setIsSleeperOpen(true)}
      />

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
        onSaveSettings={setLeagueSettings}
      />

      <SleeperModal
        isOpen={isSleeperOpen}
        onClose={() => setIsSleeperOpen(false)}
        onImportSleeperLeague={handleImportSleeperLeague}
      />

    </div>
  );
}
