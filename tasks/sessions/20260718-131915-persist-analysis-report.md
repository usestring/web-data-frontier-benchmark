# Persist benchmark and analysis reports

## Plan

- [x] Inspect the benchmark CLI, formatter, and result-file contract.
- [x] Add a reusable report writer and a results-only analysis command.
- [x] Update the benchmark CLI to persist its rendered report.
- [x] Add regression coverage and run validation.
- [ ] Commit, push, and open a PR.

## Progress

Created an isolated worktree from the merged `main` branch; the shared checkout's unrelated `bun.lock` remains untouched.

The benchmark already persists raw attempt data as JSON. The change will preserve that contract, add a sibling rendered report file for benchmark runs, and add an `analyze` command that renders an existing JSON file without invoking providers.

The benchmark CLI now writes a companion `.txt` report by default (or `--report-out`), while `npm run analyze` reads an existing JSON file and writes a report specified by `--out`.

Validation passed: `npm run typecheck`, `npm test`, `npm run analyze -- --help`, `npm run benchmark -- --help`, and a results-only analysis run against the committed official JSON that wrote a 1,411-line report.

## Review / results

The analysis command recalculated the committed results without provider traffic and wrote `results/recalculated-latency.txt` in the worktree. The report begins with String at 95.8% / 11.07s and includes per-target latency sources.
