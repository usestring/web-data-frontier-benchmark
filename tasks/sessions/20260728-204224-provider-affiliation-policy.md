# Require provider affiliation for configuration changes

## Checklist

- [x] Inspect the repository's existing contribution and benchmark documentation.
- [x] Review the open Firecrawl configuration pull request for concrete policy coverage.
- [x] Add a contribution guide with affiliation attestation and verification requirements.
- [x] Link the guide from the README.
- [x] Validate the documentation diff and repository checks.
- [x] Commit, push, and open a ready-for-review pull request.

## Progress

The repository did not have a contribution guide. The new policy makes verified current affiliation
with each affected benchmark provider's company a prerequisite for approving provider configuration
changes. It accepts public evidence or a minimal company-domain email sent only to String's existing
public support address, while prohibiting secrets and sensitive employment records.

After review, the evidence language was tightened to reject name matches, self-edited profile
fields, team rosters, and similar listings. Accepted evidence now binds the pull request author's
GitHub account directly through public membership in the provider's official GitHub organization or
a company-domain email plus a one-time phrase posted from the pull request author's account.

The change is limited to contribution policy and discoverability. It does not modify provider
configuration, target fixtures, or official benchmark results.

## Results

`git diff --check` passed, every changed Markdown line is within the repository's 140-character
Prettier limit, and the README link resolves to the new tracked guide. Runtime tests were not run
because this is a documentation-only change and the disposable checkout has no installed
dependencies.

Opened [PR #8](https://github.com/usestring/web-data-frontier-benchmark/pull/8) as a ready-for-review
pull request linked to S-130756.
