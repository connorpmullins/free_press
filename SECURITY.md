# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main` (latest) | Yes |
| Older commits | No |

Warrant is pre-1.0 software. Only the latest version on `main` receives security fixes.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email **connorpmullins@gmail.com** with:

1. A description of the vulnerability
2. Steps to reproduce it
3. The potential impact
4. Any suggested fix (optional but appreciated)

## What to Expect

- **Acknowledgment** within 48 hours
- **Assessment and response** within 7 days
- If confirmed, a fix will be prioritized and you will be credited (unless you prefer to remain anonymous)

## Scope

The following are in scope:

- Authentication bypass or session hijacking
- XSS, CSRF, or injection vulnerabilities
- Unauthorized access to user data or admin functions
- Payment/billing logic flaws (Stripe integration)
- Integrity model manipulation (reputation, distribution, revenue)

The following are out of scope:

- Denial of service (rate limiting is in place but Redis is not yet deployed in production)
- Issues in third-party dependencies (report those upstream, but let us know so we can update)
- Social engineering attacks
- Issues only reproducible on unsupported browsers

## Acknowledgments

We appreciate responsible disclosure and will credit reporters in release notes unless anonymity is requested.
