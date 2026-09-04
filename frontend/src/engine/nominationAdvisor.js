/**
 * Fantasy Football Auction Draft Bot - Nomination Strategy Advisor
 */

/**
 * Returns strategic nomination recommendations based on room cash state and manager roster needs.
 */
export function getNominationRecommendations(allPlayers, teams, myTeamId, leagueSettings) {
  const undrafted = allPlayers.filter(p => !p.draftedBy);
  if (undrafted.length === 0) return [];

  const myTeam = teams.find(t => t.id === myTeamId) || teams[0];
  const opponents = teams.filter(t => t.id !== myTeamId);

  const totalEmptySlots = teams.reduce((acc, t) => acc + (t.totalRosterSlots - t.roster.length), 0);
  const totalSlots = teams.reduce((acc, t) => acc + t.totalRosterSlots, 0);
  const percentDrafted = ((totalSlots - totalEmptySlots) / totalSlots) * 100;

  const myRosterPos = (myTeam.roster || []).map(p => p.pos);
  const myNeeds = {
    QB: myRosterPos.filter(p => p === 'QB').length < (leagueSettings.rosterRequirements.QB || 1),
    RB: myRosterPos.filter(p => p === 'RB').length < (leagueSettings.rosterRequirements.RB || 2),
    WR: myRosterPos.filter(p => p === 'WR').length < (leagueSettings.rosterRequirements.WR || 2),
    TE: myRosterPos.filter(p => p === 'TE').length < (leagueSettings.rosterRequirements.TE || 1),
  };

  const recommendations = [];

  // Strategy 1: Budget Drainer (Early Draft)
  if (percentDrafted < 40) {
    const drainTargets = undrafted.filter(p => !myNeeds[p.pos] && p.baselineAAV >= 25);
    if (drainTargets.length > 0) {
      const topDrain = drainTargets[0];
      recommendations.push({
        type: 'BUDGET_DRAINER',
        title: 'Nominate Budget Drainer',
        player: topDrain,
        reason: `Nominate ${topDrain.name} (${topDrain.posRank}). High AAV ($${topDrain.baselineAAV}) player at a position you don't urgently need. Forces rivals to spend heavy cash early.`,
        priority: 'High'
      });
    }
  }

  // Strategy 2: Value Target / Steal (Mid Draft)
  const myCash = myTeam.budget;
  const richestOpponentCash = Math.max(...opponents.map(o => o.budget), 0);

  if (myCash > richestOpponentCash) {
    const targetPlayer = undrafted.find(p => myNeeds[p.pos] && p.baselineAAV >= 15);
    if (targetPlayer) {
      recommendations.push({
        type: 'PRICE_ENFORCER',
        title: 'Bully Bidding Opportunity',
        player: targetPlayer,
        reason: `You hold the highest cash stack ($${myCash} vs top rival $${richestOpponentCash}). Nominate ${targetPlayer.name} to secure your top target.`,
        priority: 'High'
      });
    }
  }

  // Strategy 3: Sleepers ($1-$3 Targets for late draft)
  const sleeperTargets = undrafted.filter(p => p.baselineAAV <= 5 && myNeeds[p.pos]);
  if (sleeperTargets.length > 0) {
    const topSleeper = sleeperTargets[0];
    recommendations.push({
      type: 'SLEEPER_SNIPE',
      title: 'Nominate Target Sleeper',
      player: topSleeper,
      reason: `Nominate ${topSleeper.name} for $1. Great upside target for your bench/flex spot while rivals are low on funds.`,
      priority: 'Medium'
    });
  }

  return recommendations;
}
