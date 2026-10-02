const dns = require("dns").promises;
const net = require("net");

/**
 * Webhook URL validation (SSRF defence).
 *
 * The server performs the outbound request, so an unrestricted `url` lets a
 * firm admin use the backend as a proxy into the private network: cloud
 * metadata endpoints (169.254.169.254), localhost services, and other
 * tenants' internal hosts. Because delivery responses are read back to the
 * caller, this is a full read-and-write SSRF, not a blind one.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

// Ports commonly used for internal-only services.
const BLOCKED_PORTS = new Set([
  22, // ssh
  23, // telnet
  25, // smtp
  445, // smb
  1433, // mssql
  1521, // oracle
  2049, // nfs
  3306, // mysql
  3389, // rdp
  5432, // postgres
  5672, // amqp
  6379, // redis
  9200, // elasticsearch
  11211, // memcached
  27017, // mongodb
]);

const isPrivateIPv4 = (ip) => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;

  const [a, b] = parts;

  if (a === 0) return true; // "this network"
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved

  return false;
};

/**
 * Convert an IPv4-mapped/compatible IPv6 address to dotted-quad form.
 *
 * Note that `new URL()` normalises `::ffff:127.0.0.1` to `::ffff:7f00:1`, so a
 * dotted-quad-only regex misses it entirely — which would let a request aimed
 * at 127.0.0.1 through. Handle both the hex and dotted representations.
 * @returns {string|null} dotted-quad, or null if this is not a v4-mapped address
 */
const v4FromMappedIPv6 = (addr) => {
  const mapped = addr.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mapped) {
    const hi = parseInt(mapped[1], 16);
    const lo = parseInt(mapped[2], 16);
    return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff].join(".");
  }

  const dotted = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) return dotted[1];

  // IPv4-compatible (deprecated) form: ::127.0.0.1 / ::7f00:1
  const compat = addr.match(/^::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (compat && !/^0*$/.test(compat[1] + compat[2])) {
    const hi = parseInt(compat[1], 16);
    const lo = parseInt(compat[2], 16);
    return [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff].join(".");
  }

  return null;
};

const isPrivateIPv6 = (ip) => {
  const addr = ip.toLowerCase().split("%")[0];

  if (addr === "::" || addr === "::1") return true;
  if (addr.startsWith("fe80")) return true; // link-local (fe80::/10)
  if (/^f[cd]/.test(addr)) return true; // unique local (fc00::/7)
  if (addr.startsWith("ff")) return true; // multicast (ff00::/8)

  // Anything carrying an embedded IPv4 address must be judged by the IPv4 rules,
  // otherwise a loopback/link-local IPv4 target is reachable via IPv6 syntax.
  const mappedV4 = v4FromMappedIPv6(addr);
  if (mappedV4) return isPrivateIPv4(mappedV4);

  // Transition mechanisms that embed an IPv4 target.
  if (addr.startsWith("2002:")) return true; // 6to4
  if (addr.startsWith("64:ff9b:")) return true; // NAT64
  if (addr.startsWith("100:")) return true; // discard-only

  if (addr.startsWith("2001:db8")) return true; // documentation range
  if (addr.startsWith("2001:0000:") || addr.startsWith("2001::")) return true; // Teredo

  return false;
};

const isPrivateAddress = (ip) =>
  net.isIPv6(ip) ? isPrivateIPv6(ip) : isPrivateIPv4(ip);

/**
 * Parse and statically reject obviously unsafe URLs.
 * @returns {{ ok: true, url: URL } | { ok: false, error: string }}
 */
const parseWebhookUrl = (rawUrl) => {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { ok: false, error: "A webhook URL is required" };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "Webhook URL is not a valid URL" };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      ok: false,
      error: "Webhook URL must use http or https",
    };
  }

  // Credentials in the URL are a phishing/SSRF smuggling vector and are not
  // needed for webhook delivery.
  if (parsed.username || parsed.password) {
    return {
      ok: false,
      error: "Webhook URL must not contain embedded credentials",
    };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  // A literal IP can be checked immediately; a hostname needs DNS resolution,
  // which happens in assertWebhookUrlIsPublic().
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      return {
        ok: false,
        error: "Webhook URL must not point to a private or internal address",
      };
    }
  } else if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(hostname)) {
    return { ok: false, error: "Webhook URL hostname is not valid" };
  }

  if (parsed.port && BLOCKED_PORTS.has(Number(parsed.port))) {
    return {
      ok: false,
      error: `Webhook URL may not use port ${parsed.port}`,
    };
  }

  return { ok: true, url: parsed };
};

/**
 * Resolve the hostname and confirm every address it maps to is publicly
 * routable. Must be called immediately before the outbound request to limit
 * the DNS-rebinding window.
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
const assertWebhookUrlIsPublic = async (url) => {
  let addresses;
  try {
    addresses = await dns.lookup(url.hostname.replace(/^\[|\]$/g, ""), {
      all: true,
    });
  } catch {
    return { ok: false, error: "Webhook hostname could not be resolved" };
  }

  if (!addresses.length) {
    return { ok: false, error: "Webhook hostname could not be resolved" };
  }

  const blocked = addresses.find((a) => isPrivateAddress(a.address));
  if (blocked) {
    return {
      ok: false,
      error: "Webhook URL resolves to a private or internal address",
    };
  }

  return { ok: true };
};

/**
 * Header names a webhook caller may not set, because they either change the
 * routing of the outbound request or impersonate the server.
 */
const BLOCKED_HEADER_NAMES = new Set([
  "host",
  "content-length",
  "transfer-encoding",
  "connection",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
]);

/**
 * Sanitize caller-supplied webhook headers.
 */
const sanitizeWebhookHeaders = (headers) => {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return {};
  }

  const sanitized = {};
  for (const [rawName, rawValue] of Object.entries(headers).slice(0, 20)) {
    const name = String(rawName).trim();
    if (!/^[A-Za-z0-9-]{1,64}$/.test(name)) continue;
    if (BLOCKED_HEADER_NAMES.has(name.toLowerCase())) continue;
    if (name.toLowerCase().startsWith("x-webhook-")) continue;

    const value = String(rawValue).replace(/[\r\n]/g, "").slice(0, 1000);
    if (!value) continue;

    sanitized[name] = value;
  }

  return sanitized;
};

module.exports = {
  parseWebhookUrl,
  assertWebhookUrlIsPublic,
  sanitizeWebhookHeaders,
  isPrivateAddress,
};