import { jwtVerify } from "jose";

export type AccessTokenClaims = {
  sub: string;
  userId: number;
  role: string;
  type: string;
  exp: number;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

/** Verify an access JWT. Returns claims or null if invalid/expired/wrong type. */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (payload.type !== "access") {
      return null;
    }

    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
      return null;
    }

    const userId = typeof payload.userId === "number" ? payload.userId : Number(payload.userId);
    if (!Number.isFinite(userId)) {
      return null;
    }

    return {
      sub: payload.sub,
      userId,
      role: String(payload.role ?? ""),
      type: "access",
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
