/**
 * Fantasy Football Auction Draft Bot - Math & Valuation Engine
 */

export const DRAFT_STRATEGIES = {
  BALANCED: { name: 'Balanced Build', maxPlayerPct: 0.25, tier1Bonus: 1.0, description: 'Spreads budget evenly across all starting slots.' },
  STARS_AND_SCRUBS: { name: 'Stars & Scrubs', maxPlayerPct: 0.40, tier1Bonus: 1.25, description: 'Aggressively targets 2-3 top superstars, fills bench with $1 sleepers.' },
  HERO_RB: { name: 'Hero / Anchor RB', maxPlayerPct: 0.35, tier1Bonus: 1.15, description: 'Secures 1 elite stud RB, spends remaining cash on top WRs & TEs.' },
  ZERO_RB: { name: 'Zero RB', maxPlayerPct: 0.35, tier1Bonus: 0.70, description: 'Passes on early high-priced RBs to stack elite WRs, TEs, and QBs.' }
};

/**
 * Calculates current room inflation multiplier based on total budget remaining vs baseline value remaining.
 */
export function calculateInflationIndex(allPlayers, teams, leagueSettings) {
  const totalLeagueBudget = leagueSettings.numTeams * leagueSettings.totalBudget;
  const totalMoneySpent = teams.reduce((acc, t) => acc + (t.spent || 0), 0);
  const remainingLeagueBudget = totalLeagueBudget - totalMoneySpent;

  const undraftedPlayers = allPlayers.filter(p => !p.draftedBy);

  const totalEmptySlots = teams.reduce((acc, t) => acc + (t.totalRosterSlots - t.roster.length), 0);
  const sortedUndrafted = [...undraftedPlayers].sort((a, b) => (b.baselineAAV || 0) - (a.baselineAAV || 0));
  const relevantUndrafted = sortedUndrafted.slice(0, Math.max(1, totalEmptySlots));

  const totalRemainingValue = relevantUndrafted.reduce((acc, p) => acc + (p.baselineAAV || 0), 0);

  if (totalRemainingValue <= 0 || remainingLeagueBudget <= 0) {
    return 1.0;
  }

  const index = remainingLeagueBudget / totalRemainingValue;
  return Math.max(0.2, Math.min(2.5, index));
}

/**
 * Returns tier counts remaining for each position to detect tier collapses.
 */
export function getTierScarcity(allPlayers) {
  const undrafted = allPlayers.filter(p => !p.draftedBy);
  const scarcity = { QB: { t1: 0, t2: 0 }, RB: { t1: 0, t2: 0 }, WR: { t1: 0, t2: 0 }, TE: { t1: 0, t2: 0 } };

  undrafted.forEach(p => {
    if (scarcity[p.pos]) {
      if (p.tier === 1) scarcity[p.pos].t1++;
      else if (p.tier === 2) scarcity[p.pos].t2++;
    }
  });

  return scarcity;
}

/**
 * Calculates dynamic value for all players taking into account inflation, Superflex, strategy, and team needs.
 */
export function calculateDynamicValues(allPlayers, teams, myTeamId, leagueSettings, selectedStrategyKey = 'BALANCED') {
  const inflationIndex = calculateInflationIndex(allPlayers, teams, leagueSettings);
  const myTeam = teams.find(t => t.id === myTeamId) || teams[0];

  const strategy = DRAFT_STRATEGIES[selectedStrategyKey] || DRAFT_STRATEGIES.BALANCED;
  const isSuperflex = leagueSettings.isSuperflex || (leagueSettings.rosterRequirements?.SUPER_FLEX > 0);

  const myRoster = myTeam.roster || [];
  const posCounts = {
    QB: myRoster.filter(p => p.pos === 'QB').length,
    RB: myRoster.filter(p => p.pos === 'RB').length,
    WR: myRoster.filter(p => p.pos === 'WR').length,
    TE: myRoster.filter(p => p.pos === 'TE').length,
    K: myRoster.filter(p => p.pos === 'K').length,
    DST: myRoster.filter(p => p.pos === 'DST').length,
  };

  const emptyRosterSpots = myTeam.totalRosterSlots - myRoster.length;
  const maxPossibleBid = Math.max(1, myTeam.budget - Math.max(0, emptyRosterSpots - 1));

  return allPlayers.map(player => {
    const isDrafted = !!player.draftedBy;
    let baseline = player.baselineAAV || 1;

    // Apply Superflex QB Multiplier
    if (player.pos === 'QB' && isSuperflex) {
      baseline = Math.round(baseline * 1.85);
    }

    // Apply Strategy Modifiers
    let stratMod = 1.0;
    if (player.tier === 1) {
      if (selectedStrategyKey === 'ZERO_RB' && player.pos === 'RB') stratMod = 0.65;
      else if (selectedStrategyKey === 'HERO_RB' && player.pos === 'RB' && posCounts.RB === 0) stratMod = 1.20;
      else if (selectedStrategyKey === 'HERO_RB' && player.pos === 'RB' && posCounts.RB > 0) stratMod = 0.60;
      else stratMod = strategy.tier1Bonus;
    }

    baseline = Math.round(baseline * stratMod);

    // Apply baseline inflation
    let dynamicVal = Math.round(baseline * inflationIndex);
    if (baseline > 1 && dynamicVal < 1) dynamicVal = 1;

    // Needs adjustment factor for user's team
    let needMultiplier = 1.0;
    const currentPosCount = posCounts[player.pos] || 0;
    let reqPosCount = leagueSettings.rosterRequirements[player.pos] || 1;

    if (player.pos === 'QB' && isSuperflex) {
      reqPosCount += (leagueSettings.rosterRequirements.SUPER_FLEX || 1);
    }

    if (currentPosCount >= reqPosCount + 2) {
      needMultiplier = 0.5;
    } else if (currentPosCount < reqPosCount) {
      needMultiplier = 1.15;
    }

    const targetVal = Math.round(dynamicVal * needMultiplier);
    const minTarget = Math.max(1, Math.round(targetVal * 0.85));
    const maxTarget = Math.min(maxPossibleBid, Math.max(1, Math.round(targetVal * 1.15)));

    // Bargain percentage calculation vs baseline
    const bargainPct = baseline > 0 ? Math.round(((dynamicVal - baseline) / baseline) * 100) : 0;

    return {
      ...player,
      baselineAAV: baseline,
      dynamicValue: isDrafted ? player.cost : dynamicVal,
      targetBidMin: isDrafted ? player.cost : minTarget,
      targetBidMax: isDrafted ? player.cost : maxTarget,
      bargainPct,
      valueDiff: dynamicVal - baseline,
    };
  });
}

/**
 * Calculates max bid possible for a specific team while leaving $1 for each remaining empty roster spot.
 */
export function getMaxBid(team) {
  const emptySpots = team.totalRosterSlots - team.roster.length;
  if (emptySpots <= 0) return 0;
  return Math.max(1, team.budget - (emptySpots - 1));
}
