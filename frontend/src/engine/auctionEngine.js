/**
 * Fantasy Football Auction Draft Bot - Math & Valuation Engine
 */

/**
 * Calculates current room inflation multiplier based on total budget remaining vs baseline value remaining.
 * @param {Array} allPlayers - Full player pool with draft status & baseline values
 * @param {Array} teams - Array of team objects with total budget & spent money
 * @param {Object} leagueSettings - League budget, roster sizes, team count
 */
export function calculateInflationIndex(allPlayers, teams, leagueSettings) {
  const totalLeagueBudget = leagueSettings.numTeams * leagueSettings.totalBudget;
  const totalMoneySpent = teams.reduce((acc, t) => acc + (t.spent || 0), 0);
  const remainingLeagueBudget = totalLeagueBudget - totalMoneySpent;

  // Filter remaining undrafted players
  const undraftedPlayers = allPlayers.filter(p => !p.draftedBy);

  // Sum baseline AAV of top remaining players equal to total roster spots left in league
  const totalEmptySlots = teams.reduce((acc, t) => acc + (t.totalRosterSlots - t.roster.length), 0);
  
  // Sort undrafted by baseline value descending
  const sortedUndrafted = [...undraftedPlayers].sort((a, b) => (b.baselineAAV || 0) - (a.baselineAAV || 0));
  const relevantUndrafted = sortedUndrafted.slice(0, totalEmptySlots);

  const totalRemainingValue = relevantUndrafted.reduce((acc, p) => acc + (p.baselineAAV || 0), 0);

  if (totalRemainingValue <= 0 || remainingLeagueBudget <= 0) {
    return 1.0;
  }

  // Inflation index > 1.0 means teams have more money left than baseline value (prices should rise)
  // Inflation index < 1.0 means teams spent heavily early, cash is scarce (prices should fall)
  const index = remainingLeagueBudget / totalRemainingValue;
  return Math.max(0.2, Math.min(2.5, index));
}

/**
 * Calculates dynamic value for all players taking into account inflation and team needs.
 */
export function calculateDynamicValues(allPlayers, teams, myTeamId, leagueSettings) {
  const inflationIndex = calculateInflationIndex(allPlayers, teams, leagueSettings);
  const myTeam = teams.find(t => t.id === myTeamId) || teams[0];

  // Count positional roster needs for my team
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
    const baseline = player.baselineAAV || 1;

    // Apply baseline inflation
    let dynamicVal = Math.round(baseline * inflationIndex);
    if (baseline > 1 && dynamicVal < 1) dynamicVal = 1;

    // Needs adjustment factor for user's team
    let needMultiplier = 1.0;
    const currentPosCount = posCounts[player.pos] || 0;
    const reqPosCount = leagueSettings.rosterRequirements[player.pos] || 1;

    if (currentPosCount >= reqPosCount + 2) {
      // Position is overcrowded
      needMultiplier = 0.5;
    } else if (currentPosCount < reqPosCount) {
      // High positional urgency
      needMultiplier = 1.15;
    }

    const targetVal = Math.round(dynamicVal * needMultiplier);
    const minTarget = Math.max(1, Math.round(targetVal * 0.85));
    const maxTarget = Math.min(maxPossibleBid, Math.max(1, Math.round(targetVal * 1.15)));

    return {
      ...player,
      dynamicValue: isDrafted ? player.cost : dynamicVal,
      targetBidMin: isDrafted ? player.cost : minTarget,
      targetBidMax: isDrafted ? player.cost : maxTarget,
      valueDiff: dynamicVal - baseline,
    };
  });
}

/**
 * Calculates max bid possible for a specific team while leaving  for each remaining empty roster spot.
 */
export function getMaxBid(team) {
  const emptySpots = team.totalRosterSlots - team.roster.length;
  if (emptySpots <= 0) return 0;
  return Math.max(1, team.budget - (emptySpots - 1));
}
