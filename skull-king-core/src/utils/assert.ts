/**
 * @param condition
 * @param message
 * @throws {@link Error}
 */
export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
