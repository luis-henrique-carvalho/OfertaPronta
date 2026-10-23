import { describe, it, expect } from "vitest";
import {
  signVisitorId,
  verifyVisitorId,
  hashIp,
  normalizeIp,
  resolveClientIp,
  parseVisitorCookie,
  formatVisitorCookieValue,
  resolveVisitorIdentity,
} from "./visitor-identity";

describe("Visitor Identity (HMAC Cookie & IP Hash Protection)", () => {
  const secret = "test-secret-must-be-at-least-32-characters-long!";
  const previousSecret = "old-secret-must-be-at-least-32-characters-long!";

  describe("signVisitorId and verifyVisitorId", () => {
    it("signs a visitor UUID and verifies successfully with current secret", () => {
      const visitorId = "e87c6b90-8e12-4c6e-8212-07e372eb0f32";
      const signature = signVisitorId(visitorId, secret);

      expect(typeof signature).toBe("string");
      expect(signature.length).toBeGreaterThan(10);

      const isValid = verifyVisitorId(visitorId, signature, secret);
      expect(isValid).toBe(true);
    });

    it("verifies successfully with previousSecret during key rotation", () => {
      const visitorId = "e87c6b90-8e12-4c6e-8212-07e372eb0f32";
      const signatureWithOld = signVisitorId(visitorId, previousSecret);

      const isValid = verifyVisitorId(
        visitorId,
        signatureWithOld,
        secret,
        previousSecret,
      );
      expect(isValid).toBe(true);
    });

    it("rejects tampered signature or mismatched visitorId", () => {
      const visitorId = "e87c6b90-8e12-4c6e-8212-07e372eb0f32";
      const signature = signVisitorId(visitorId, secret);

      expect(verifyVisitorId(visitorId, "tampered-sig", secret)).toBe(false);
      expect(verifyVisitorId("different-uuid", signature, secret)).toBe(false);
      expect(verifyVisitorId("", signature, secret)).toBe(false);
    });

    it("formats and parses cookie value <uuid>.<signature>", () => {
      const visitorId = "e87c6b90-8e12-4c6e-8212-07e372eb0f32";
      const cookieValue = formatVisitorCookieValue(visitorId, secret);

      expect(cookieValue).toContain(`${visitorId}.`);

      const parsed = parseVisitorCookie(cookieValue, secret);
      expect(parsed).not.toBeNull();
      expect(parsed?.visitorId).toBe(visitorId);
      expect(parsed?.isNew).toBe(false);
    });

    it("returns null for malformed cookie value", () => {
      expect(parseVisitorCookie("invalid-no-dot", secret)).toBeNull();
      expect(parseVisitorCookie("not-a-uuid.signature", secret)).toBeNull();
      expect(parseVisitorCookie("", secret)).toBeNull();
    });
  });

  describe("IP resolution and hashing", () => {
    it("resolves cf-connecting-ip first regardless of trustedProxy flag", () => {
      const headers = new Headers({
        "cf-connecting-ip": "203.0.113.195",
        "x-forwarded-for": "198.51.100.1, 192.0.2.1",
      });
      const ip = resolveClientIp(headers, false);
      expect(ip).toBe("203.0.113.195");
    });

    it("resolves first IP of x-forwarded-for when trustedProxy is true", () => {
      const headers = new Headers({
        "x-forwarded-for": "198.51.100.42, 10.0.0.1, 10.0.0.2",
      });
      const ip = resolveClientIp(headers, true);
      expect(ip).toBe("198.51.100.42");
    });

    it("ignores x-forwarded-for when trustedProxy is false (anti-spoofing)", () => {
      const headers = new Headers({
        "x-forwarded-for": "198.51.100.42",
        "x-real-ip": "192.168.1.50",
      });
      const ip = resolveClientIp(headers, false);
      expect(ip).toBe("192.168.1.50");
    });

    it("returns 'unknown' when no client IP header is present", () => {
      const headers = new Headers();
      const ip = resolveClientIp(headers, true);
      expect(ip).toBe("unknown");
    });

    it("normalizes IPv6 to /64 prefix to prevent subnet hopping", () => {
      const ipv6_1 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      const ipv6_2 = "2001:0db8:85a3:0000:ffff:ffff:ffff:ffff";
      expect(normalizeIp(ipv6_1)).toBe("2001:0db8:85a3:0000::/64");
      expect(normalizeIp(ipv6_2)).toBe("2001:0db8:85a3:0000::/64");
    });

    it("hashes IP with HMAC-SHA256 hex and never outputs raw IP", () => {
      const ip = "203.0.113.5";
      const hash1 = hashIp(ip, secret);
      const hash2 = hashIp(ip, secret);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
      expect(hash1).not.toContain(ip);

      const diffHash = hashIp("203.0.113.6", secret);
      expect(diffHash).not.toBe(hash1);
    });
  });

  describe("resolveVisitorIdentity", () => {
    it("extracts valid visitorId and creates ipHash from headers", () => {
      const visitorId = "b92138aa-8032-411a-826f-422204c35c60";
      const cookieValue = formatVisitorCookieValue(visitorId, secret);

      const headers = new Headers({
        cookie: `op_vid=${cookieValue}; other_cookie=xyz`,
        "cf-connecting-ip": "198.51.100.22",
      });

      const identity = resolveVisitorIdentity({
        headers,
        secret,
        trustedProxy: false,
      });

      expect(identity.visitorId).toBe(visitorId);
      expect(identity.isNewVisitor).toBe(false);
      expect(identity.ipHash).toBe(hashIp("198.51.100.22", secret));
      expect(identity.cookieToSet).toBeNull();
    });

    it("issues a new signed visitorId and cookieToSet when cookie is missing or invalid", () => {
      const headers = new Headers({
        cookie: "op_vid=tampered-bad-sig",
        "cf-connecting-ip": "198.51.100.22",
      });

      const identity = resolveVisitorIdentity({
        headers,
        secret,
        trustedProxy: false,
      });

      expect(identity.visitorId).toBeDefined();
      expect(identity.isNewVisitor).toBe(true);
      expect(identity.cookieToSet).not.toBeNull();
      expect(identity.cookieToSet?.name).toBe("op_vid");
      expect(identity.cookieToSet?.value).toContain(`${identity.visitorId}.`);
    });
  });
});
