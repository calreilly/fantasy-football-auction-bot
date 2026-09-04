/**
 * Fantasy Football Auction Draft Bot - AI Bidding Mock Simulator
 */

import { getMaxBid } from './auctionEngine.js';

export const AI_PERSONALITIES = {
  STARS_AND_SCRUBS: { name: 'Star Hunter', maxOverpayRatio: 1.25, prefPositions: ['RB', 'WR'] },
  VALUE_HUNTER: { name: 'Value Hunter', maxOverpayRatio: 1.05, prefPositions: ['WR', 'TE', 'QB'] },
  BALANCED: { name: 'Balanced Manager', maxOverpayRatio: 1.12, prefPositions: ['QB', 'RB', 'WR', 'TE'] },
  ZERO_RB: { name: 'Zero-RB Fanatic', maxOverpayRatio: 1.20, prefPositions: ['WR', 'TE', 'QB'] }
};

/**
 * Determines if an AI team wants to outbid on the current player at currentBid price.
 */
export function getAiBidDecision(team, player, currentBid, highBidderId, leagueSettings) {
  if (team.id === highBidderId) return false; // Already highest bidder

  const emptySpots = team.totalRosterSlots - team.roster.length;
  if (emptySpots <= 0) return false;

  const maxPossible = getMaxBid(team);
  const nextBid = currentBid + 1;

  if (nextBid > maxPossible) return false; // Exceeds budget constraints

  // Position needs check
  const posCount = team.roster.filter(p => p.pos === player.pos).length;
  const maxAllowedForPos = (leagueSettings.rosterRequirements[player.pos] || 1) + 2;

  if (posCount >= maxAllowedForPos) return false;

  const personality = AI_PERSONALITIES[team.strategy] || AI_PERSONALITIES.BALANCED;
  const isPreferred = personality.prefPositions.includes(player.pos);

  const baseValue = player.baselineAAV || 1;
  const maxWillingToPay = Math.round(baseValue * (isPreferred ? personality.maxOverpayRatio : 0.95));

  if (nextBid <= maxWillingToPay && nextBid <= maxPossible) {
    return true; // AI places bid
  }

  return false;
}

/**
 * Returns the next nomination from an AI manager when it is their turn.
 */
export function getAiNomination(team, undraftedPlayers, leagueSettings) {
  if (undraftedPlayers.length === 0) return null;

  const personality = AI_PERSONALITIES[team.strategy] || AI_PERSONALITIES.BALANCED;
  const neededPositions = Object.keys(leagueSettings.rosterRequirements).filter(pos => {
    const count = team.roster.filter(p => p.pos === pos).length;
    return count < leagueSettings.rosterRequirements[pos];
  });

  // Filter undrafted by needed positions first
  let candidates = undraftedPlayers.filter(p => neededPositions.includes(p.pos));
  if (candidates.length === 0) candidates = undraftedPlayers;

  // Sort candidates by baseline value
  candidates.sort((a, b) => b.baselineAAV - a.baselineAAV);

  // Return top candidate or random top 3
  const topSlice = candidates.slice(0, Math.min(3, candidates.length));
  return topSlice[Math.floor(Math.random() * topSlice.length)];
}
