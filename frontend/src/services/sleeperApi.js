/**
 * Fantasy Football Auction Draft Bot - Sleeper API Integration Service
 */

const SLEEPER_BASE_URL = 'https://api.sleeper.app/v1';

/**
 * Fetches user profile by username.
 */
export async function getSleeperUser(username) {
  try {
    const res = await fetch(`${SLEEPER_BASE_URL}/user/${username}`);
    if (!res.ok) throw new Error('User not found on Sleeper');
    return await res.json();
  } catch (err) {
    console.error('Error fetching Sleeper user:', err);
    throw err;
  }
}

/**
 * Fetches user leagues for specified season (defaults to 2026/2025).
 */
export async function getUserLeagues(userId, season = '2026') {
  try {
    const res = await fetch(`${SLEEPER_BASE_URL}/user/${userId}/leagues/nfl/${season}`);
    if (!res.ok) throw new Error('Could not fetch Sleeper leagues');
    let leagues = await res.json();
    if (!leagues || leagues.length === 0) {
      // Fallback to 2025 if 2026 leagues haven't been created yet
      const fallbackRes = await fetch(`${SLEEPER_BASE_URL}/user/${userId}/leagues/nfl/2025`);
      if (fallbackRes.ok) {
        leagues = await fallbackRes.json();
      }
    }
    return leagues;
  } catch (err) {
    console.error('Error fetching Sleeper leagues:', err);
    throw err;
  }
}

/**
 * Parses Sleeper roster_positions array to extract starting slot requirements & superflex rules.
 */
export function parseSleeperRosterRules(rosterPositions) {
  const reqs = { QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, SUPER_FLEX: 0, K: 0, DST: 0, BN: 0 };
  
  if (!rosterPositions || !Array.isArray(rosterPositions)) {
    return {
      rosterRequirements: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPER_FLEX: 0, K: 1, DST: 1 },
      totalRosterSlots: 15,
      isSuperflex: false
    };
  }

  rosterPositions.forEach(pos => {
    if (pos === 'QB') reqs.QB++;
    else if (pos === 'RB') reqs.RB++;
    else if (pos === 'WR') reqs.WR++;
    else if (pos === 'TE') reqs.TE++;
    else if (pos === 'FLEX' || pos === 'WRRB_FLEX') reqs.FLEX++;
    else if (pos === 'SUPER_FLEX' || pos === 'REC_FLEX') reqs.SUPER_FLEX++;
    else if (pos === 'K') reqs.K++;
    else if (pos === 'DEF' || pos === 'DST') reqs.DST++;
    else reqs.BN++;
  });

  const isSuperflex = reqs.SUPER_FLEX > 0 || reqs.QB >= 2;
  const totalRosterSlots = rosterPositions.length;

  return {
    rosterRequirements: reqs,
    totalRosterSlots,
    isSuperflex
  };
}

/**
 * Fetches draft settings & draft picks for a specific draft ID.
 */
export async function getSleeperDraftData(draftId) {
  try {
    const [draftRes, picksRes] = await Promise.all([
      fetch(`${SLEEPER_BASE_URL}/draft/${draftId}`),
      fetch(`${SLEEPER_BASE_URL}/draft/${draftId}/picks`)
    ]);

    if (!draftRes.ok) throw new Error('Could not fetch Sleeper draft');
    const draft = await draftRes.json();
    const picks = picksRes.ok ? await picksRes.json() : [];

    return { draft, picks };
  } catch (err) {
    console.error('Error fetching Sleeper draft data:', err);
    throw err;
  }
}
