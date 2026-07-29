# Simplify company email affiliation verification

## Checklist

- [x] Inspect the merged affiliation policy.
- [x] Remove the one-time verification phrase.
- [x] Define the sufficient company-domain email contents.
- [x] Validate the documentation diff.
- [ ] Commit, push, and open a ready-for-review pull request.

## Progress

Company-domain email is now sufficient evidence when it identifies the GitHub contributor, company
and provider, pull request, and confirms that the sender wants that pull request's provider
configuration merged. The policy no longer requires a public phrase or follow-up challenge.

## Results

`git diff --check` passed, all changed Markdown lines remain within the repository's 140-character
Prettier limit, and the diff changes documentation only. Runtime tests were not run because the
change has no runtime behavior.
