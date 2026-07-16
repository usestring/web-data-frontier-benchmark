# Reproduce the July 15 latency scores

The official raw run remains the source of truth at
[`official_results/benchmark-2026-07-15T21-36-21-625Z.json`](../official_results/benchmark-2026-07-15T21-36-21-625Z.json).
This directory contains flat CSV files that open directly in Excel, Google Sheets, Numbers, or any data tool.

## Generate or verify the files

```bash
npm install
npm run export:reproducibility
npm run verify:reproducibility
```

To use another raw JSON result, pass its path and an output directory:

```bash
npm run export:reproducibility -- path/to/result.json path/to/output
```

## Files

- `benchmark-attempt-inputs.csv` — one row per provider and target, with all attempt success flags and exact millisecond latencies.
- `benchmark-target-scores.csv` — the intermediate calculation for every provider-target pair, including the own successful-attempt p75, peer fallback, scoring mode, and final target score.
- `benchmark-provider-scores.csv` — the 15 published provider totals and success rates.

## Calculation rule

For each provider-target pair, sort only the successful attempt latencies from fastest to slowest. The own target score is the nearest-rank p75:

```text
rank = ceil(0.75 × successful attempt count)
own score = successful latency at that rank
```

If a provider has no successful attempt for a target, use the nearest-rank p75 of the successful providers' own scores for that same target. If no provider succeeds, use the benchmark timeout of 90,000 ms. The `scoring_mode` and fallback columns make each branch visible in the target-level CSV.
