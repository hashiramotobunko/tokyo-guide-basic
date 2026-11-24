import { saveCountConfig } from './save-count-config.mjs';

export const saveCountsEnabled = Boolean(saveCountConfig?.projectUrl && saveCountConfig?.publishableKey);

export async function recordPlaceSave(placeId, config = saveCountConfig, request = fetch) {
  if (!config?.projectUrl || !config?.publishableKey) return false;
  const endpoint = new URL('/rest/v1/rpc/record_place_save', config.projectUrl);
  if (endpoint.protocol !== 'https:') return false;

  try {
    const response = await request(endpoint, {
      method: 'POST',
      headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_place_id: placeId }),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}
