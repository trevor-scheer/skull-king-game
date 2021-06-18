/**
 * @param condition
 * @param message
 * @throws {@link Error}
 */
export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
