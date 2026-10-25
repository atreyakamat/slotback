import { LogOut } from "lucide-react";
import { getMember } from "@/server/auth/dal";
import { logout } from "@/server/actions/auth";

/** Signed-in user and workspace. Reads the session, so it renders behind a Suspense boundary. */
export async function AccountCard() {
  const member = await getMember();
  if (!member) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.organization.name}</p>
        <p className="truncate text-xs text-muted">
          {member.user.name} · {member.role.toLowerCase()}
        </p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Sign out"
          className="grid size-8 place-items-center rounded-md text-muted hover:bg-surface-raised hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}
