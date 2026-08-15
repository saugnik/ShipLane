import { SiteNav } from "@/components/marketing/SiteNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { currentSession } from "@/lib/auth/session";

/**
 * Public marketing site. Every page in this group gets the tabbed nav and the
 * footer, so adding a page is just adding a file.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await currentSession();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SiteNav signedIn={Boolean(session)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
