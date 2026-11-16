import type { Pool, PoolClient } from "pg";

export type RlsContext = {
  userId: string;
  role: "patient" | "professional" | "admin";
};

async function applyRls(client: PoolClient, ctx: RlsContext): Promise<void> {
  await client.query(`SELECT set_config('app.user_id', $1, true)`, [ctx.userId]);
  await client.query(`SELECT set_config('app.role', $1, true)`, [ctx.role]);
}

export type WithRlsOptions = {
  /** Aplica SET LOCAL ROLE telehealth_app (tests y runtime sin superusuario). */
  useAppRole?: boolean;
};

export async function withRlsClient<T>(
  pool: Pool,
  ctx: RlsContext,
  fn: (client: PoolClient) => Promise<T>,
  options?: WithRlsOptions,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (options?.useAppRole) {
      await client.query(`SET LOCAL ROLE telehealth_app`);
    }
    await applyRls(client, ctx);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}