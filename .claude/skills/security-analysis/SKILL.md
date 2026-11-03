---
name: security-analysis
description: analyze source code and pull request changes for security vulnerabilities, unsafe data handling, exposed credentials, injection risks, authorization flaws, and insecure programming practices. use during code reviews when security analysis is required.
---

# Security Analysis

Analyze the supplied code changes using the following workflow.

## 1. Identify trust boundaries

Determine where data enters the application, including:

- HTTP requests
- Command-line arguments
- Environment variables
- Database results
- Files
- External APIs
- User-submitted content

Do not assume external data is safe.

## 2. Examine input handling

Check whether untrusted input is:

- Validated before use
- Sanitized where appropriate
- Restricted to an expected type, format, or range
- Passed into sensitive operations

Pay special attention to input used in:

- Database queries
- Shell commands
- File paths
- HTML output
- URLs
- Dynamic code execution

## 3. Check for injection risks

Look for evidence of:

- SQL injection
- Command injection
- Path traversal
- Cross-site scripting
- Server-side request forgery
- Unsafe deserialization
- Dynamic code execution

Report an injection issue only when the code provides concrete evidence of the risk.

## 4. Review authentication and authorization

Check whether protected operations:

- Verify the caller's identity
- Enforce authorization
- Validate ownership or permissions
- Prevent privilege escalation
- Avoid trusting client-provided role information

Do not treat authentication and authorization as interchangeable.

## 5. Review secrets and sensitive data

Check for:

- Hardcoded API keys
- Hardcoded access tokens
- Passwords in source code
- Credentials written to logs
- Sensitive information exposed in errors
- Secrets committed to configuration files

Recommend environment variables or an appropriate secret-management system when credentials are embedded in code.

Never reproduce a complete discovered secret in the analysis. Refer to its location and redact its value.

## 6. Review error handling and logging

Check whether the code:

- Exposes internal implementation details
- Logs credentials or personal information
- Silently ignores security failures
- Returns raw stack traces to users
- Handles rejected promises and exceptions safely

## 7. Review dependencies and unsafe APIs

Identify insecure or risky API usage only when supported by the reviewed code.

Do not claim that a dependency is vulnerable unless reliable dependency information is available.

## 8. Assign severity

Use these severity levels:

- critical: directly exploitable issue with severe impact, such as exposed production credentials or unauthenticated remote code execution
- high: likely exploitable issue that could expose sensitive data or bypass important security controls
- medium: security weakness requiring specific conditions or offering limited impact
- low: defense-in-depth improvement with minimal immediate risk

Do not exaggerate severity.

## 9. Produce actionable findings

For each finding, provide:

- A concise title
- The affected file
- The affected line when available
- A clear description supported by the code
- The security impact
- A practical recommendation
- An appropriate severity

Do not invent vulnerabilities.

When evidence is incomplete, explain what should be verified instead of presenting the concern as a confirmed vulnerability.
