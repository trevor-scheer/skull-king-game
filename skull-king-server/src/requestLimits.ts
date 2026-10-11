import { getOperationAST, GraphQLError, Kind, parse, SelectionSetNode, ValidationRule } from 'graphql';
import type { RequestHandler } from 'express';

/** Count expanded fragment use, not only the compact document supplied by a client. */
export const boundedOperation: ValidationRule = context => ({
  OperationDefinition(operation) {
    let fields = 0;
    let roots = 0;
    let rejected = false;
    const reject = () => {
      if (!rejected) context.reportError(new GraphQLError('This request is too complex. Split it into smaller requests.'));
      rejected = true;
    };
    const scan = (selection: SelectionSetNode, depth: number, path: Set<string>) => {
      if (rejected) return;
      if (depth > 16) { reject(); return; }
      for (const item of selection.selections) {
        if (rejected) return;
        if (item.kind === Kind.FIELD) {
          if (++fields > 500 || (depth === 1 && ++roots > (operation.operation === 'mutation' ? 1 : 20))) { reject(); return; }
          if (item.selectionSet) scan(item.selectionSet, depth + 1, path);
        } else if (item.kind === Kind.INLINE_FRAGMENT) scan(item.selectionSet, depth, path);
        else {
          if (path.has(item.name.value)) { reject(); return; }
          const fragment = context.getFragment(item.name.value);
          if (fragment) scan(fragment.selectionSet, depth, new Set([...path, item.name.value]));
        }
      }
    };
    scan(operation.selectionSet, 1, new Set());
  },
});

export const guardGraphqlRequests: RequestHandler = (req, res, next) => {
  const batch = Array.isArray(req.body);
  const operations = batch ? req.body : [req.method === 'GET' ? req.query : req.body];
  if (batch && (operations.length < 1 || operations.length > 10)) {
    res.status(400).json({ error: 'Send between one and ten queries per batch.' }); return;
  }
  try {
    for (const operation of operations) {
      if (!operation || typeof operation.query !== 'string') {
        if (batch) throw Error('Every batch entry must include a query.');
        continue;
      }
      const document = parse(operation.query, { maxTokens: 4000 });
      if (batch && getOperationAST(document, operation.operationName)?.operation !== 'query') throw Error('Only queries can be batched.');
    }
  } catch {
    res.status(400).json({ error: 'Invalid or oversized query. Only read-only queries can be batched.' }); return;
  }
  next();
};

export function requestRateLimit(now = Date.now): RequestHandler {
  const buckets = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const time = now();
    const key = req.ip ?? req.socket.remoteAddress ?? 'local';
    if (buckets.size >= 10000) for (const [ip, bucket] of buckets) if (bucket.reset <= time) buckets.delete(ip);
    let bucket = buckets.get(key);
    if (!bucket && buckets.size >= 10000) { res.status(503).json({ error: 'Please try again shortly.' }); return; }
    if (!bucket || bucket.reset <= time) { bucket = { count: 0, reset: time + 60_000 }; buckets.set(key, bucket); }
    // Nine players may share a household address. Batched queries count once.
    if (++bucket.count > 2400) { res.set('Retry-After', '60').status(429).json({ error: 'Please wait a moment before trying again.' }); return; }
    next();
  };
}
