import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/api";
import { currentSession, type Role, type SessionClaims } from "@/lib/auth/session";

/**
 * Access rules, in one place.
 *
 *   USER   creates and updates their own consignments. Cannot delete anything.
 *   ADMIN  sees every account's traffic, read-only. Cannot create, update or
 *          delete — it is an oversight account, not a super-user.
 *
 * Nothing on the platform deletes: the two roles between them leave no one with
 * delete rights, which is the intended policy rather than an oversight.
 */

export type Viewer = SessionClaims;

export const isAdmin = (v: Viewer | null) => v?.role === "ADMIN";
export const canWrite = (v: Viewer | null) => v?.role === "USER";
export const canDelete = () => false;

// ---------------------------------------------------------------- pages

/** Server-component guard. Redirects to login when signed out. */
export async function requireViewer(returnTo?: string): Promise<Viewer> {
  const session = await currentSession();
  if (!session) {
    redirect(`/login${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`);
  }
  return session;
}

export async function requireRole(role: Role, returnTo?: string): Promise<Viewer> {
  const viewer = await requireViewer(returnTo);
  if (viewer.role !== role) redirect("/dashboard");
  return viewer;
}

// ---------------------------------------------------------------- api

/** Route-handler guard. Throws an HttpError the api wrapper turns into JSON. */
export async function apiViewer(): Promise<Viewer> {
  const session = await currentSession();
  if (!session) throw new HttpError("You must be signed in", 401);

  // The token carries the role, but a deactivated or role-changed account must
  // lose access immediately rather than at token expiry.
  const account = await prisma.account.findUnique({
    where: { id: session.sub },
    select: { active: true, role: true, tokenVersion: true },
  });
  if (!account || !account.active || account.tokenVersion !== session.v) {
    throw new HttpError("Your session is no longer valid. Please sign in again.", 401);
  }

  return { ...session, role: account.role as Role };
}

/** Guard for any mutating endpoint. */
export async function apiWriter(): Promise<Viewer> {
  const viewer = await apiViewer();
  if (viewer.role === "ADMIN") {
    throw new HttpError("The admin account has read-only access", 403);
  }
  return viewer;
}

/** Guard for deletes — refuses everyone, by policy. */
export async function apiDeleter(): Promise<never> {
  await apiViewer();
  throw new HttpError(
    "Records on this platform cannot be deleted. Deactivate or supersede them instead.",
    403,
  );
}

/**
 * Row-level scope for consignments: a USER sees only what they booked, an
 * ADMIN sees everything. Returns a Prisma `where` fragment.
 */
export function orderScope(viewer: Viewer): { createdById?: string } {
  return viewer.role === "ADMIN" ? {} : { createdById: viewer.sub };
}
