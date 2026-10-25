/**
 * True for something shaped like a database id (cuid). Checked at the edge so hostile path
 * segments (NUL bytes, quotes, megabyte strings) are turned away before they reach a query.
 */
export function isId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]{10,40}$/i.test(value);
}
