import { db } from '../../db/pool.js';

export async function listAccounts(tenantId, options = {}) {
  const limit = Math.min(Number(options.limit || 100), 300);
  const offset = Math.max(Number(options.offset || 0), 0);

  const result = await db.query(
    `
    SELECT id, platform, handle, login_username, status, created_at
    FROM social_accounts
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [tenantId, limit, offset]
  );

  return result.rows;
}

export async function createAccount(tenantId, payload) {
  const result = await db.query(
    `
    INSERT INTO social_accounts (
      id,
      tenant_id,
      platform,
      handle,
      login_username,
      login_password_enc,
      status
    )
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active')
    RETURNING id, tenant_id, platform, handle, login_username, status, created_at
    `,
    [
      tenantId,
      payload.platform,
      payload.handle,
      payload.loginUsername,
      payload.loginPasswordEnc
    ]
  );

  return result.rows[0];
}

export async function updateAccountStatus(tenantId, accountId, status) {
  const result = await db.query(
    `
    UPDATE social_accounts
    SET status = $3, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id, platform, handle, login_username, status, updated_at
    `,
    [accountId, tenantId, status]
  );

  return result.rows[0] || null;
}
