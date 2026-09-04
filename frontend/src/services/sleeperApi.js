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
