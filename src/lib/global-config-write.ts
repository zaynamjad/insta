/**
 * Shared write path for the project's single Global Config store
 * (`hikerapi-keys`, id below — holds more than just HikerAPI keys now,
 * despite the slug). Reads go through `@vercel/global-config`'s own SDK
 * (see each feature's own store module); only writes need this, since
 * Global Config's read-token is read-only — writes go through the Vercel
 * REST API with `VERCEL_API_TOKEN` instead.
 */

/** Not secret — a Global Config/Vercel resource id, not a credential. */
const EDGE_CONFIG_ID = "ecfg_j1zztto7tbn1hvnlbsmas3qqrzhc";
const VERCEL_TEAM_ID = "team_0gVH2bECHS5S1kug76oJG0PM";

export async function writeGlobalConfigItem(key: string, value: unknown): Promise<void> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    throw new Error("VERCEL_API_TOKEN is not configured — Global Config writes are disabled.");
  }

  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items?teamId=${VERCEL_TEAM_ID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items: [{ operation: "upsert", key, value }] }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to update Global Config key "${key}" (${res.status}): ${text.slice(0, 300)}`);
  }
}
