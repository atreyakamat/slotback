/** A failed API call. `message` comes from the server and is safe to show. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export type Session = { server: string; token: string };

async function parse(res: Response) {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(body.error ?? "Something went wrong. Please try again.", res.status);
  return body;
}

export async function call<T>(session: Session, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${session.server}/api/mobile${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError("Can't reach SlotBack. Check your internet connection.", 0);
  }
  return (await parse(res)) as T;
}

/** Calls that happen before the phone has a token: pairing and the demo. */
export async function getToken(server: string, path: "/pair" | "/demo", body?: unknown): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${server}/api/mobile${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Can't reach ${server}. Check the address and your connection.`, 0);
  }
  const data = (await parse(res)) as { token?: string };
  if (!data.token) throw new ApiError("The server didn't return a sign-in token.", res.status);
  return data.token;
}

/** Reads a pairing QR: slotback://pair?api=<server>&code=<code>. */
export function parsePairingCode(data: string): { server: string; code: string } | null {
  const match = /^slotback:\/\/pair\?(.+)$/.exec(data.trim());
  if (!match) return null;
  const params = new URLSearchParams(match[1]);
  const server = params.get("api");
  const code = params.get("code");
  if (!server || !code || !/^https?:\/\//.test(server)) return null;
  return { server: server.replace(/\/+$/, ""), code };
}

/** Types for the API's responses. Dates arrive as ISO strings. */
export type Me = {
  user: { id: string; name: string; email: string };
  business: { name: string; isDemo: boolean };
  location: { id: string; name: string; timezone: string; currency: string };
  role: "OWNER" | "ADMIN" | "STAFF";
};

export type Today = {
  week: { recoveredPaise: number; claimed: number; fillRate: number | null; medianMinutesToFill: number | null };
  stats: { bookedToday: number; upcomingToday: number; activeWaitlist: number; recentCancellations: number; liveCampaigns: number };
  live: { id: string; startAt: string; expiresAt: string | null; service: string; staff: string; offers: number }[];
  next: { id: string; startAt: string; endAt: string; customer: string; service: string; staff: string }[];
  recent: { id: string; serviceName: string; customerName: string; valuePaise: number; startAt: string; minutesToFill: number }[];
};

export type AppointmentStatus = "BOOKED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type Schedule = {
  date: string;
  hours: { open: string; close: string }[];
  staff: {
    id: string;
    name: string;
    appointments: { id: string; startAt: string; endAt: string; status: AppointmentStatus; recovered: boolean; customer: string; service: string }[];
  }[];
};

export type Campaign = {
  id: string;
  status: "DRAFT" | "ACTIVE" | "CLAIMED" | "EXPIRED" | "CANCELLED";
  startAt: string;
  endAt: string;
  expiresAt: string | null;
  service: string;
  staff: string;
  valuePaise: number;
  batchSize: number;
  quietUntil: string | null;
  message: string;
  nextUp: string[];
  eligibleCount: number;
  excluded: { name: string; reason: string }[];
  offers: { id: string; customer: string; channel: string; status: string; expiresAt: string }[];
  claimedBy: string | null;
};

export type Waitlist = {
  services: { id: string; name: string }[];
  entries: {
    id: string;
    name: string;
    phone: string | null;
    service: string | null;
    days: number[];
    earliestMinute: number;
    latestMinute: number;
    channels: string[];
    joinedAt: string;
  }[];
};
