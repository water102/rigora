# Batch 56: Influence list and limits

- Added deterministic influence listing with lock metadata.
- Added maximum-influence pruning that preserves locked bones and renormalizes rows.
- Rejects limits lower than the number of locked influences.
- Validation: `pnpm check`.
