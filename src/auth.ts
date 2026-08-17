import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { query } from "@/lib/db";

async function provisionUser(email: string, name: string | null | undefined) {
  const existing = await query<{ id: string; role: string }>(
    `SELECT id, role FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );

  if (existing.rowCount === 0) {
    await query(
      `INSERT INTO users (email, password_hash, jmeno, role)
       VALUES ($1, NULL, $2, 'user')`,
      [email.toLowerCase(), name ?? null],
    );
    return;
  }

  await query(
    `UPDATE users SET jmeno = COALESCE($2, jmeno) WHERE email = $1`,
    [email.toLowerCase(), name ?? null],
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      try {
        await provisionUser(profile.email, profile.name);
        return true;
      } catch (err) {
        console.error("Auth provisioning failed:", err);
        return false;
      }
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = profile.email.toLowerCase();
      }

      const email = token.email as string | undefined;
      if (email) {
        const result = await query<{ id: string; role: string; jmeno: string | null }>(
          `SELECT id, role, jmeno FROM users WHERE email = $1`,
          [email],
        );
        const user = result.rows[0];
        if (user) {
          token.userId = user.id;
          token.role = user.role as "admin" | "user";
          token.name = user.jmeno ?? email;
        }
      }
      return token;
    },
    session({ session, token }) {
      const t = token as {
        email?: string;
        userId?: string;
        role?: "admin" | "user";
        name?: string;
      };
      if (session.user) {
        if (t.email) session.user.email = t.email;
        if (t.userId) session.user.id = t.userId;
        if (t.role) session.user.role = t.role;
        if (t.name) session.user.name = t.name;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      if (
        path === "/login" ||
        path.startsWith("/api/auth") ||
        path.startsWith("/api/cron") ||
        path.startsWith("/schvaleni") ||
        path.startsWith("/email")
      ) {
        return true;
      }
      return !!auth?.user;
    },
  },
});
