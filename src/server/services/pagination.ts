import { z } from "zod";
import { TRPCError } from "@trpc/server";

const cursorSchema = z.object({ at: z.string().datetime(), id: z.string().uuid() }).strict();
export function decodeCursor(cursor?: string) {
  if (!cursor) return undefined;
  try {
    const parsed = cursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")));
    return { at: new Date(parsed.at), id: parsed.id };
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST" });
  }
}
export function encodeCursor(at: Date, id: string): string {
  return Buffer.from(JSON.stringify({ at: at.toISOString(), id })).toString("base64url");
}
export function page<T extends { id: string }>(rows: T[], limit: number, date: (row: T) => Date) {
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return { items, nextCursor: hasMore && last ? encodeCursor(date(last), last.id) : null };
}
