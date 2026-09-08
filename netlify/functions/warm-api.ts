/**
 * Keeps the Netlify API function warm so mobile requests are less flaky.
 * Runs every 5 minutes.
 */
export const config = {
  schedule: '*/5 * * * *',
};

export async function handler() {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://rupak26.netlify.app';
  const url = `${base.replace(/\/$/, '')}/api/health`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    const body = await response.text();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: response.ok, status: response.status, body }),
    };
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'warm failed',
      }),
    };
  }
}
