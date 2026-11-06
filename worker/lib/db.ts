/**
 * D1 helpers shared by the query modules — the SQL expression for "now" in the stored
 * timestamp format, and detection of SQLite unique-constraint failures.
 */

export const SQL_NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

const UNIQUE_VIOLATION = /UNIQUE constraint failed: \w+\.(\w+)/;

/**
 * Returns the column a SQLite UNIQUE constraint failed on, or undefined when err is
 * anything else. D1 exposes no error codes, so the message is the only signal.
 */
export function uniqueViolationColumn(err: unknown): string | undefined {
  if (!(err instanceof Error)) return undefined;
  return UNIQUE_VIOLATION.exec(err.message)?.[1];
}
