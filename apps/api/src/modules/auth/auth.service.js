import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/pool.js';
import { env } from '../../config/env.js';

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '1d' });
}

export async function registerUser({ tenantId, email, password, fullName }) {
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await db.query(
    `
    INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, 'admin')
    RETURNING id, tenant_id, email, full_name, role, created_at
    `,
    [tenantId, email, passwordHash, fullName]
  );

  const user = result.rows[0];
  const accessToken = signToken({
    sub: user.id,
    tenantId: user.tenant_id,
    role: user.role
  });

  return { user, accessToken };
}

export async function loginUser({ email, password }) {
  const result = await db.query(
    `
    SELECT id, tenant_id, email, full_name, role, password_hash
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  const accessToken = signToken({
    sub: user.id,
    tenantId: user.tenant_id,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    accessToken
  };
}
