# Contributing

Thanks for helping improve the Web Data Frontier Benchmark. Keep pull requests focused, explain how
the change preserves a fair comparison, and include enough validation for maintainers to reproduce
the result without exposing credentials.

## Provider configuration changes

The benchmark aims to exercise each provider using the configuration that provider currently
recommends for this workload. To prevent unverified external configuration changes from affecting
the comparison, maintainers will approve a provider configuration change from an external
contributor only after verifying that the contributor is currently affiliated with the company
responsible for the affected provider.

Repository maintainers may bypass the affiliation requirement. A maintainer may implement a
configuration change directly or explicitly state on an external pull request that they are taking
responsibility for the change. Routine review does not silently invoke this exception.

This requirement applies to any change that affects how a benchmarked provider runs, including:

- adding or removing a provider;
- changing a provider endpoint, request parameter, product or proxy mode, or response handling;
- changing provider credentials, environment variables, activation, or registration; and
- changing documentation that prescribes how a provider is configured for an official run.

Unless a repository maintainer invokes the exception, affiliation must be verified for each company
affected by a pull request. If you are not affiliated with the affected company, open an issue with
your evidence and recommendation instead, or ask a repository maintainer to explicitly take
responsibility for the configuration change.

### Attestation and evidence

Unless a repository maintainer has explicitly taken responsibility for the change, include this
attestation in the pull request description:

> I attest that I am currently affiliated with **[company]** and that this change reflects its
> recommended configuration for this benchmark.

The evidence must directly bind the GitHub account that opened the pull request to the affected
company. A matching name, a self-edited profile employer field, a company team directory or roster,
a LinkedIn page, or another page that merely lists someone with the same name is not sufficient.

Use one of these verification paths:

- Make the pull request author's membership in the provider's official GitHub organization public
  on the same GitHub account that opened the pull request.
- Send an email from your company-domain address to
  [support@usestring.ai](mailto:support@usestring.ai) with the subject
  `Benchmark affiliation verification for PR #<number>`. The message must include your GitHub
  username, the company and provider, and the pull request URL. A maintainer will reply with a
  one-time verification phrase; post that phrase on the pull request from the account that opened
  it to complete verification.

A self-attestation without verifiable evidence is not sufficient. If verification is sent by email,
state that in the pull request without posting the private message or address. Maintainers will note
on the pull request when verification is complete.

Do not post or email API keys, account credentials, employee IDs, employment documents, contracts,
or other sensitive personal information. Company-domain email ownership is sufficient for the
email verification path.

For external contributors without an explicit maintainer exception, verified affiliation is a
prerequisite for approval, not a guarantee of acceptance. Maintainers will still review every
change for fairness, reproducibility, scope, and consistency with the benchmark methodology.

## Validation

- Do not commit `.env` files, API keys, or raw credentials.
- Start with a small provider-and-target smoke test before running a larger, billable benchmark.
- Describe the commands run and their results in the pull request.
- Keep official result updates separate from configuration changes unless maintainers request them.
