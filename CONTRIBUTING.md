# Contributing

Thanks for helping improve the Web Data Frontier Benchmark. Keep pull requests focused, explain how
the change preserves a fair comparison, and include enough validation for maintainers to reproduce
the result without exposing credentials.

## Provider configuration changes

The benchmark aims to exercise each provider using one configuration that provider currently
recommends for the entire workload. To prevent unverified external configuration changes from
affecting the comparison, maintainers will approve a provider configuration change from an external
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
  username, the company and provider, the pull request URL, and confirmation that you want the
  provider configuration in that pull request merged. Receipt of that company-domain email is
  sufficient verification; no public challenge is required. For a new provider, also include the
  [funded-account setup information](#api-key-and-funded-account-required-for-new-providers).

A self-attestation without verifiable evidence is not sufficient. If verification is sent by email,
state that in the pull request without posting the private message or address. Maintainers will note
on the pull request when verification is complete.

Do not post or email API keys, account credentials, employee IDs, employment documents, contracts,
or other sensitive personal information. Company-domain email ownership is sufficient for the
email verification path.

For external contributors without an explicit maintainer exception, verified affiliation is a
prerequisite for approval, not a guarantee of acceptance. Maintainers will still review every
change for fairness, reproducibility, scope, and consistency with the benchmark methodology.

## API key and funded account required for new providers

Every provider requesting addition must supply maintainers with an API key and enough
provider-funded credits or quota to cover independent validation and official benchmark runs before
its adapter can be accepted. The key must enable the submitted configuration, including any paid
modes it uses. A full run currently makes 500 attempts per provider (100 targets × 5 attempts).

When emailing the contact address in [Attestation and evidence](#attestation-and-evidence), include
the pull request URL and a pathway for maintainers to create a funded account: a signup link or
account-setup steps, plus instructions for receiving the required funds or credits. Include this
information in the affiliation-verification email if using that verification path. Use email to
arrange a private credential handoff; do not include credentials in that email,
affiliation-verification emails, public issues, pull requests, or commits.

State any credit, rate, or expiry limits in the pull request without including the key. Maintainers
must confirm that the supplied key works and has sufficient funding or quota before approving the
addition. An environment-variable placeholder or provider-reported results alone do not satisfy
this requirement.

## What an adapter may do

Every provider is measured the same way, so these hold for every adapter, whoever opens the pull request:

- **One configuration per provider.** Use the same adapter-selected settings for every source in
  the suite. Do not choose engines, rendering, CAPTCHA solving, proxy country, warm-up pages, or
  other provider options based on the target URL, hostname, fixture name, or other target properties.
  Per-domain lookup tables and country selection derived from a target's domain are not allowed.
  The target URL itself varies on each request; the provider may choose its strategy internally
  behind the same API configuration.
- **One request per attempt.** The adapter sends the attempt once and the runner scores whatever comes back,
  errors included. Adapters do not retry on errors, blocks or timeouts, and SDK clients that retry by default
  are set to zero retries.
- **Fetch APIs only.** The adapter makes one HTTP request to the provider's API and gets the page back. We do
  not drive browser sessions over CDP, WebDriver or similar protocols, so a hosted-browser product can be
  benchmarked only through a fetch-style endpoint (Browserbase runs through its Fetch API).

Pull requests that violate these rules will be closed. Open an issue if you think a rule is wrong.

## Validation

- Do not commit `.env` files, API keys, or raw credentials.
- Start with a small provider-and-target smoke test before running a larger, billable benchmark.
- Describe the commands run and their results in the pull request.
- Keep official result updates separate from configuration changes unless maintainers request them.
