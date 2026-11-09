import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import {
  toDate,
  toISOString,
  isFirestoreTimestamp,
  timestampSchema,
} from "@/lib/firebase/timestamps";
import {
  toFirestoreTimestamp,
  nowTimestamp,
} from "@/lib/firebase/server-timestamps";

describe("Firestore Timestamp Utilities", () => {
  it("converts Date to Firestore Timestamp and back", () => {
    const originalDate = new Date("2026-11-07T10:30:00.000Z");
    const ts = toFirestoreTimestamp(originalDate);

    expect(isFirestoreTimestamp(ts)).toBe(true);
    expect(ts.seconds).toBe(Math.floor(originalDate.getTime() / 1000));

    const convertedDate = toDate(ts);
    expect(convertedDate).toBeInstanceOf(Date);
    expect(convertedDate?.toISOString()).toBe(originalDate.toISOString());
  });

  it("converts ISO strings to Firestore Timestamp", () => {
    const iso = "2026-11-07T14:45:00.000Z";
    const ts = toFirestoreTimestamp(iso);
    expect(isFirestoreTimestamp(ts)).toBe(true);
    expect(toISOString(ts)).toBe(iso);
  });

  it("returns null when converting null or undefined to Date or ISO", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toISOString(null)).toBeNull();
    expect(toISOString(undefined)).toBeNull();
  });

  it("returns current timestamp with nowTimestamp()", () => {
    const before = Date.now();
    const ts = nowTimestamp();
    const after = Date.now();

    const millis = ts.toMillis();
    expect(millis).toBeGreaterThanOrEqual(before - 100);
    expect(millis).toBeLessThanOrEqual(after + 100);
  });

  it("validates valid timestamps using timestampSchema", () => {
    expect(timestampSchema.safeParse(new Date()).success).toBe(true);
    expect(timestampSchema.safeParse(Timestamp.now()).success).toBe(true);
    expect(timestampSchema.safeParse("2026-11-07T12:00:00Z").success).toBe(true);
    expect(timestampSchema.safeParse(1700000000000).success).toBe(true);
  });

  it("rejects invalid timestamp inputs using timestampSchema", () => {
    expect(timestampSchema.safeParse("not-a-date").success).toBe(false);
    expect(timestampSchema.safeParse(null).success).toBe(false);
    expect(timestampSchema.safeParse(undefined).success).toBe(false);
    expect(timestampSchema.safeParse({}).success).toBe(false);
  });

  it("throws on invalid input to toFirestoreTimestamp", () => {
    expect(() => toFirestoreTimestamp("invalid-timestamp")).toThrow(
      "Invalid timestamp input: invalid-timestamp"
    );
  });
});
