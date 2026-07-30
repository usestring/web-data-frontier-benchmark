# Clarify the maintainer affiliation exception

## Checklist

- [x] Inspect the merged affiliation policy and README summary.
- [x] Define an explicit maintainer exception without weakening external identity verification.
- [x] Update the contribution guide and README.
- [x] Validate the documentation diff.
- [x] Commit, push, and open a ready-for-review pull request.

## Progress

The affiliation requirement now applies to external contributors by default. Repository maintainers
may implement configuration changes directly or explicitly state that they are taking responsibility
for an external pull request. Routine review does not silently invoke the exception.

The existing identity-bound evidence paths remain unchanged for external contributions that do not
use the maintainer exception.

## Results

`git diff --check` passed, all changed Markdown lines remain within the repository's 140-character
Prettier limit, and the contribution guide and README describe the same maintainer exception.
Runtime tests were not run because the change is documentation-only.

Opened [PR #9](https://github.com/usestring/web-data-frontier-benchmark/pull/9) as a ready-for-review
pull request linked to S-130781.
