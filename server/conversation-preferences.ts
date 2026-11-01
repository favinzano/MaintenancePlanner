import type { ConversationLanguage } from "../src/domain/planner.js";

export type { ConversationLanguage } from "../src/domain/planner.js";

export type UserPrincipal = { userId: string; workspaceId: string };

type QueryResult<Row> = { rows: Row[] };
export interface PreferenceDatabase {
  query<Row = unknown>(sql: string, values?: unknown[]): Promise<QueryResult<Row>>;
}

export function parseConversationLanguage(value: unknown): ConversationLanguage | null {
  return value === "en" || value === "es" ? value : null;
}

export async function loadConversationLanguage(db: PreferenceDatabase, user: UserPrincipal): Promise<ConversationLanguage> {
  const { rows } = await db.query<{ conversation_language: string }>(
    `SELECT conversation_language
       FROM public.user_preferences
      WHERE user_id = $1 AND workspace_id = $2`,
    [user.userId, user.workspaceId],
  );
  return rows[0]?.conversation_language === "es" ? "es" : "en";
}

export async function saveConversationLanguage(
  db: PreferenceDatabase,
  user: UserPrincipal,
  language: ConversationLanguage,
): Promise<ConversationLanguage> {
  const { rows } = await db.query<{ conversation_language: string }>(
    `INSERT INTO public.user_preferences AS current_preference (user_id, workspace_id, conversation_language)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET conversation_language = EXCLUDED.conversation_language, updated_at = now()
       WHERE current_preference.workspace_id = EXCLUDED.workspace_id
     RETURNING conversation_language`,
    [user.userId, user.workspaceId, language],
  );
  if (!rows[0]) {
    throw Object.assign(new Error("This account's language preference is not available in the current workspace."), { statusCode: 409 });
  }

  const verified = await loadConversationLanguage(db, user);
  if (verified !== language) {
    throw Object.assign(new Error("The language preference was saved, but its read-back could not be verified."), { statusCode: 503 });
  }
  return verified;
}
