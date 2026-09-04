/**
 * Fantasy Football Auction Draft Bot - AI Bidding & Full Mock Simulator Engine
 */

import { getMaxBid } from './auctionEngine.js';

export const AI_PERSONALITIES = {
  STARS_AND_SCRUBS: { name: 'Star Hunter', maxOverpayRatio: 1.25, prefPositions: ['RB', 'WR'], nomStyle: 'HIGH_AAV' },
  VALUE_HUNTER: { name: 'Value Hunter', maxOverpayRatio: 1.05, prefPositions: ['WR', 'TE', 'QB'], nomStyle: 'VALUE' },
  BALANCED: { name: 'Balanced Manager', maxOverpayRatio: 1.12, prefPositions: ['QB', 'RB', 'WR', 'TE'], nomStyle: 'BALANCED' },
  ZERO_RB: { name: 'Zero-RB Fanatic', maxOverpayRatio: 1.20, prefPositions: ['WR', 'TE', 'QB'], nomStyle: 'PASS_RB' }
};

/**
 * Determines if an AI team wants to outbid on the current player at currentBid price.
 */
export function getAiBidDecision(team, player, currentBid, highBidderId, leagueSettings) {
  if (team.id === highBidderId) return false;

  const emptySpots = team.totalRosterSlots - team.roster.length;
  if (emptySpots <= 0) return false;

  const maxPossible = getMaxBid(team);
  const nextBid = currentBid + 1;

  if (nextBid > maxPossible) return false;

  // Position needs check
  const posCount = team.roster.filter(p => p.pos === player.pos).length;
  const reqPosCount = leagueSettings.rosterRequirements[player.pos] || 1;
  const maxAllowedForPos = reqPosCount + 2;

  if (posCount >= maxAllowedForPos) return false;

  const personality = AI_PERSONALITIES[team.strategy] || AI_PERSONALITIES.BALANCED;
  const isPreferred = personality.prefPositions.includes(player.pos);

  const baseValue = player.baselineAAV || 1;
  const maxWillingToPay = Math.round(baseValue * (isPreferred ? personality.maxOverpayRatio : 0.95));

  if (nextBid <= maxWillingToPay && nextBid <= maxPossible) {
    return true;
  }

  return false;
}

/**
 * Returns the next nomination from an AI manager when it is their turn.
 */
export function getAiNomination(team, undraftedPlayers, leagueSettings) {
  if (undraftedPlayers.length === 0) return null;

  const neededPositions = Object.keys(leagueSettings.rosterRequirements).filter(pos => {
    const count = team.roster.filter(p => p.pos === pos).length;
    return count < leagueSettings.rosterRequirements[pos];
  });

  let candidates = undraftedPlayers.filter(p => neededPositions.includes(p.pos));
  if (candidates.length === 0) candidates = undraftedPlayers;

  candidates.sort((a, b) => (b.baselineAAV || 0) - (a.baselineAAV || 0));

  const topSlice = candidates.slice(0, Math.min(4, candidates.length));
  return topSlice[Math.floor(Math.random() * topSlice.length)];
}

/**
 * Computes Draft Grade & Standings for all teams after draft completion.
 */
export function calculateDraftGrades(teams, allPlayers) {
  const standings = teams.map(team => {
    const roster = team.roster || [];
    const totalPts = roster.reduce((sum, p) => sum + (p.projPts || 0), 0);
    const totalSpent = team.spent || 0;
    const surplusValue = roster.reduce((sum, p) => sum + ((p.dynamicValue || p.baselineAAV) - p.cost), 0);

    return {
      teamId: team.id,
      name: team.name,
      totalPts,
      totalSpent,
      surplusValue,
      rosterCount: roster.length,
      roster
    };
  });

  // Sort standings by projected points descending
  standings.sort((a, b) => b.totalPts - a.totalPts);

  // Assign grades to standings
  const maxPts = standings[0]?.totalPts || 1;
  const userRank = standings.findIndex(s => s.teamId === 'team-me') + 1;
  const userTeam = standings.find(s => s.teamId === 'team-me');

  let grade = 'B';
  if (userRank === 1) grade = 'A+';
  else if (userRank <= 3) grade = 'A';
  else if (userRank <= 5) grade = 'B+';
  else if (userRank <= 8) grade = 'B';
  else grade = 'C';

  // Extract top steals (cost significantly lower than dynamic value)
  const draftedPlayers = allPlayers.filter(p => p.draftedBy && p.cost);
  const steals = [...draftedPlayers]
    .map(p => ({ ...p, surplus: (p.baselineAAV || 1) - p.cost }))
    .sort((a, b) => b.surplus - a.surplus)
    .slice(0, 5);

  const overpays = [...draftedPlayers]
    .map(p => ({ ...p, overpay: p.cost - (p.baselineAAV || 1) }))
    .sort((a, b) => b.overpay - a.overpay)
    .slice(0, 5);

  return {
    grade,
    userRank,
    standings,
    steals,
    overpays,
    userTeam
  };
}
