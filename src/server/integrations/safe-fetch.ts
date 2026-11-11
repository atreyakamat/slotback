import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request } from "node:https";
import { isIP } from "node:net";

/**
 * Outbound HTTP to URLs that businesses type in (webhooks). Without care this is a server-side
 * request forgery hole: a URL pointing at 169.254.169.254, localhost or the private network would
 * make SlotBack's servers fetch internal resources. So:
 * - only https, on the default port, with no username/password in the URL;
 * - every address the host name resolves to is checked *at connect time* (inside the socket's DNS
 *   lookup), so a name can't resolve to a public IP for the check and a private one for the
 *   request (DNS rebinding);
 * - redirects are not followed, responses are read only up to 64 KB, and there's a 5-second timeout.
 */

export class UnsafeUrlError extends Error {}

/** True for loopback, private, link-local, carrier-grade NAT, multicast and other non-public addresses. */
export function isPrivateAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (family === 6) {
    const v = address.toLowerCase();
    if (v === "::" || v === "::1") return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    // IPv4-mapped in hex (::ffff:7f00:1 is 127.0.0.1), as URL parsing normalises it.
    const hex = v.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const hi = parseInt(hex[1], 16);
      const lo = parseInt(hex[2], 16);
      return isPrivateAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    // Anything else starting "::" is unspecified, loopback or an IPv4-compatible/translated form.
    if (v.startsWith("::")) return true;
    return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v) || v.startsWith("64:ff9b:") || v.startsWith("2001:db8");
  }
  return true;
}

/** Checks the shape of a webhook URL before it's saved. Returns a reason when it isn't allowed. */
export function webhookUrlProblem(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "Enter a full URL, starting with https://";
  }
  if (url.protocol !== "https:") return "Webhook URLs must start with https://";
  if (url.username || url.password) return "Webhook URLs can't contain a username or password.";
  if (url.port && url.port !== "443") return "Webhook URLs must use the standard HTTPS port.";
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) ? isPrivateAddress(host) : /(^|\.)(localhost|local|internal|intranet|lan)$/i.test(host)) {
    return "Webhook URLs must point to a public address.";
  }
  if (raw.length > 500) return "That URL is too long.";
  return null;
}

type Lookup = typeof dnsLookup;

/** A DNS lookup that refuses to hand back any non-public address. */
export function guardedLookup(base: Lookup = dnsLookup): Lookup {
  return ((hostname: string, options: unknown, callback: unknown) => {
    const cb = (typeof options === "function" ? options : callback) as (err: Error | null, address?: string | LookupAddress[], family?: number) => void;
    const opts = (typeof options === "function" ? {} : options ?? {}) as Record<string, unknown>;
    base(hostname, { ...opts, all: true }, (err, addresses) => {
      if (err) return cb(err);
      const list = addresses as unknown as LookupAddress[];
      if (list.length === 0 || list.some((a) => isPrivateAddress(a.address))) {
        return cb(new UnsafeUrlError(`${hostname} resolves to a non-public address`));
      }
      if (opts.all) return cb(null, list);
      return cb(null, list[0].address, list[0].family);
    });
  }) as Lookup;
}

export type SafePostResult = { status: number; body: string };

/** POSTs `body` to a vetted https URL. Throws UnsafeUrlError for disallowed targets. */
export function safePost(
  rawUrl: string,
  body: string,
  headers: Record<string, string>,
  opts: { timeoutMs?: number; lookup?: Lookup } = {},
): Promise<SafePostResult> {
  const problem = webhookUrlProblem(rawUrl);
  if (problem) return Promise.reject(new UnsafeUrlError(problem));
  const url = new URL(rawUrl);
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json", "content-length": Buffer.byteLength(body), "user-agent": "SlotBack-Webhooks/1" },
        lookup: guardedLookup(opts.lookup),
        timeout: opts.timeoutMs ?? 5000,
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          if (text.length < 65_536) text += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: text.slice(0, 65_536) }));
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
    req.end(body);
  });
}
