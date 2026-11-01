import assert from "node:assert/strict";
import test from "node:test";
import {
  loadConversationLanguage,
  parseConversationLanguage,
  saveConversationLanguage,
  type PreferenceDatabase,
  type UserPrincipal,
} from "./conversation-preferences.js";

const owner: UserPrincipal = {
  userId: "11111111-1111-4111-8111-111111111111",
  workspaceId: "22222222-2222-4222-8222-222222222222",
};

class MemoryPreferences implements PreferenceDatabase {
  language: string | null = null;
  workspaceId = owner.workspaceId;
  queryCount = 0;

  async query<Row>(sql: string, values: unknown[] = []): Promise<{ rows: Row[] }> {
    this.queryCount += 1;
    const [userId, workspaceId, language] = values;
    if (sql.includes("INSERT INTO public.user_preferences")) {
      if (userId !== owner.userId || workspaceId !== this.workspaceId) return { rows: [] };
      this.language = String(language);
      return { rows: [{ conversation_language: this.language } as Row] };
    }
    if (sql.includes("SELECT conversation_language")) {
      if (userId !== owner.userId || workspaceId !== this.workspaceId || this.language === null) return { rows: [] };
      return { rows: [{ conversation_language: this.language } as Row] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  }
}

test("accepts only the specified conversation languages", () => {
  assert.equal(parseConversationLanguage("en"), "en");
  assert.equal(parseConversationLanguage("es"), "es");
  for (const value of ["fr", "EN", "English", null, undefined, {}, 1]) {
    assert.equal(parseConversationLanguage(value), null);
  }
});

test("defaults a missing row to English and reads only the authenticated user and workspace", async () => {
  const db = new MemoryPreferences();
  assert.equal(await loadConversationLanguage(db, owner), "en");
  assert.deepEqual(await db.query("SELECT conversation_language WHERE user_id = $1 AND workspace_id = $2", ["different-user", owner.workspaceId]), { rows: [] });
  assert.equal(await loadConversationLanguage(db, { ...owner, workspaceId: "33333333-3333-4333-8333-333333333333" }), "en");
});

test("saves and independently reads back the authenticated user's language", async () => {
  const db = new MemoryPreferences();
  assert.equal(await saveConversationLanguage(db, owner, "es"), "es");
  assert.equal(db.language, "es");
  assert.equal(db.queryCount, 2);
});

test("rejects a preference row associated with another workspace", async () => {
  const db = new MemoryPreferences();
  db.workspaceId = "33333333-3333-4333-8333-333333333333";
  await assert.rejects(saveConversationLanguage(db, owner, "es"), { statusCode: 409 });
});
