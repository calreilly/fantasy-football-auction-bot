/**
 * Fantasy Football Auction Draft Bot - Sleeper API Integration & Auto-Pilot Service
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
 * Fetches user leagues for specified season.
 */
export async function getUserLeagues(userId, season = '2026') {
  try {
    const res = await fetch(`${SLEEPER_BASE_URL}/user/${userId}/leagues/nfl/${season}`);
    if (!res.ok) throw new Error('Could not fetch Sleeper leagues');
    let leagues = await res.json();
    if (!leagues || leagues.length === 0) {
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
 * Parses Sleeper roster_positions array.
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

/**
 * Live Draft Poller: Polls Sleeper draft picks every 1.5 seconds for live sync.
 */
export function startLiveSleeperPolling(draftId, onPicksUpdated) {
  if (!draftId) return null;

  let lastCount = -1;
  const intervalId = setInterval(async () => {
    try {
      const res = await fetch(`${SLEEPER_BASE_URL}/draft/${draftId}/picks`);
      if (res.ok) {
        const picks = await res.json();
        if (picks.length !== lastCount) {
          lastCount = picks.length;
          onPicksUpdated(picks);
        }
      }
    } catch (e) {
      console.warn('Sleeper polling warning:', e);
    }
  }, 1500);

  return () => clearInterval(intervalId);
}

/**
 * Auto-Bid execution payload for Sleeper internal GraphQL API.
 */
export async function sendSleeperAutoBid(draftId, player, bidAmount, sleeperAuthToken) {
  if (!sleeperAuthToken) {
    console.log(`[Auto-Pilot Simulation]: Placed bid of $${bidAmount} on ${player.name}`);
    return { success: true, simulated: true };
  }

  try {
    const response = await fetch('https://sleeper.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': sleeperAuthToken
      },
      body: JSON.stringify({
        operationName: 'auction_bid',
        variables: {
          draft_id: draftId,
          player_id: player.id,
          bid_amount: bidAmount
        },
        query: `mutation auction_bid($draft_id: String!, $player_id: String!, $bid_amount: Int!) {
          auction_bid(draft_id: $draft_id, player_id: $player_id, bid_amount: $bid_amount)
        }`
      })
    });

    const result = await response.json();
    return { success: !result.errors, data: result };
  } catch (err) {
    console.error('Error executing Sleeper auto-bid:', err);
    return { success: false, error: err.message };
  }
}
