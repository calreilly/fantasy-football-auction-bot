import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

import Header from "./components/Header.jsx";
import AuctionDashboard from "./components/AuctionDashboard.jsx";
import PlayerBoard from "./components/PlayerBoard.jsx";
import MyRosterWidget from "./components/MyRosterWidget.jsx";
import RivalTracker from "./components/RivalTracker.jsx";
import NominationAdvisorWidget from "./components/NominationAdvisorWidget.jsx";
import MockSimControls from "./components/MockSimControls.jsx";
import DraftGradeModal from "./components/DraftGradeModal.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import SleeperModal from "./components/SleeperModal.jsx";

import { DEFAULT_PLAYERS } from "./data/defaultPlayers.js";
import { calculateDynamicValues, calculateInflationIndex, getMaxBid } from "./engine/auctionEngine.js";
import { getAiBidDecision, getAiNomination, AI_PERSONALITIES } from "./engine/mockSimulator.js";
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
  const [autoPilot, setAutoPilot] = useState(false);
  const [strategyKey, setStrategyKey] = useState("BALANCED");

  // Mock Sim State
  const [simStatus, setSimStatus] = useState("IDLE"); // "IDLE", "RUNNING", "PAUSED", "FINISHED"
  const [simSpeed, setSimSpeed] = useState(1000); // ms per step
  const [draftLog, setDraftLog] = useState([]);
  const [isGradesOpen, setIsGradesOpen] = useState(false);
  const nomTurnIndexRef = useRef(0);

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

  const dynamicPlayers = calculateDynamicValues(players, teams, "team-me", leagueSettings, strategyKey);
  const inflationIndex = calculateInflationIndex(players, teams, leagueSettings);

  const activePlayerDynamic = activePlayer 
    ? dynamicPlayers.find(p => p.id === activePlayer.id) 
    : null;

  // Auto-Pilot Logic
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

  // Automated Mock Sim Loop
  useEffect(() => {
    if (mode !== "MOCK" || simStatus !== "RUNNING") return;

    const timer = setTimeout(() => {
      handleSimStep();
    }, simSpeed);

    return () => clearTimeout(timer);
  }, [mode, simStatus, activePlayer, currentBid, highBidderId, players, teams]);

  const addLog = (msg) => {
    setDraftLog(prev => [...prev, msg]);
  };

  // Perform single AI Mock Step
  const handleSimStep = () => {
    const undrafted = dynamicPlayers.filter(p => !p.draftedBy);

    // Check if draft is finished
    const totalSlotsLeft = teams.reduce((sum, t) => sum + (t.totalRosterSlots - t.roster.length), 0);
    if (undrafted.length === 0 || totalSlotsLeft === 0) {
      setSimStatus("FINISHED");
      addLog("🎉 Mock Draft Completed! All teams full.");
      setIsGradesOpen(true);
      return;
    }

    // Step A: If no active player, handle next nomination
    if (!activePlayer) {
      const nomTeamIndex = nomTurnIndexRef.current % teams.length;
      const nomTeam = teams[nomTeamIndex];
      nomTurnIndexRef.current++;

      if (nomTeam.id === "team-me") {
        // User's turn to nominate in mock
        const rec = undrafted[0];
        if (rec) {
          handleNominatePlayer(rec);
          addLog(`My Team nominated ${rec.name} (${rec.pos}) for $1`);
        }
      } else {
        // AI team nominates
        const aiPlayer = getAiNomination(nomTeam, undrafted, leagueSettings);
        if (aiPlayer) {
          setActivePlayer(aiPlayer);
          setCurrentBid(1);
          setHighBidderId(nomTeam.id);
          addLog(`${nomTeam.name} nominated ${aiPlayer.name} (${aiPlayer.pos}) for $1`);
        }
      }
      return;
    }

    // Step B: Outbid check for all AI teams
    for (const team of teams) {
      if (team.id === highBidderId) continue;
      if (team.id === "team-me" && !autoPilot) continue;

      const wantsToBid = getAiBidDecision(team, activePlayerDynamic, currentBid, highBidderId, leagueSettings);
      if (wantsToBid) {
        const nextBid = currentBid + 1;
        setCurrentBid(nextBid);
        setHighBidderId(team.id);
        addLog(`${team.name} bid $${nextBid} on ${activePlayerDynamic.name}`);
        return;
      }
    }

    // Step C: If no further outbids, finalize pick
    const winningTeam = teams.find(t => t.id === highBidderId) || teams[0];
    addLog(`SOLD! ${activePlayerDynamic.name} to ${winningTeam.name} for $${currentBid}`);
    handleCompletePick(activePlayerDynamic.id, winningTeam.id, currentBid);
  };

  const handleInstantSim = () => {
    setSimStatus("RUNNING");
    let safeLoop = 0;
    while (safeLoop < 300) {
      safeLoop++;
      const undrafted = players.filter(p => !p.draftedBy);
      const totalSlotsLeft = teams.reduce((sum, t) => sum + (t.totalRosterSlots - t.roster.length), 0);
      if (undrafted.length === 0 || totalSlotsLeft === 0) break;

      const nomTeamIndex = nomTurnIndexRef.current % teams.length;
      const nomTeam = teams[nomTeamIndex];
      nomTurnIndexRef.current++;

      const p = undrafted[0];
      if (p) {
        const winner = teams[safeLoop % teams.length];
        const cost = Math.max(1, p.baselineAAV || 1);
        handleCompletePick(p.id, winner.id, cost);
      }
    }
    setSimStatus("FINISHED");
    setIsGradesOpen(true);
  };

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

  const handleResetDraft = () => {
    if (window.confirm("Are you sure you want to reset all draft picks and budgets?")) {
      setPlayers(DEFAULT_PLAYERS);
      setTeams(createTeamsList(leagueSettings.numTeams, leagueSettings.totalBudget, leagueSettings.totalRosterSlots));
      setActivePlayer(null);
      setCurrentBid(0);
      setHighBidderId(null);
      setSimStatus("IDLE");
      setDraftLog([]);
      nomTurnIndexRef.current = 0;
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

      {mode === "MOCK" && (
        <MockSimControls
          simStatus={simStatus}
          simSpeed={simSpeed}
          setSimSpeed={setSimSpeed}
          onStartSim={() => setSimStatus("RUNNING")}
          onPauseSim={() => setSimStatus("PAUSED")}
          onStepSim={handleSimStep}
          onInstantSim={handleInstantSim}
          draftLog={draftLog}
          onViewGrades={() => setIsGradesOpen(true)}
        />
      )}

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
        onAiStep={handleSimStep}
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

      <DraftGradeModal
        isOpen={isGradesOpen}
        onClose={() => setIsGradesOpen(false)}
        teams={teams}
        players={players}
      />

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
