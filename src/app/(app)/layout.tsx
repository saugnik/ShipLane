import { AppShell } from "@/components/AppShell";
import { requireViewer } from "@/lib/auth/guard";

/**
 * Everything under this group is the signed-in console.
 *
 * The guard runs here rather than in each page so a new route cannot be added
 * without inheriting authentication.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  return <AppShell viewer={viewer}>{children}</AppShell>;
}
