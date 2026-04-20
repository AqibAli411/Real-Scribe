# Security Incident Response Playbook

## 1. Detection

- Trigger sources:
  - CI security job failures
  - Rate limit spike logs
  - Unexpected error-rate increase
  - Secret leakage alerts

## 2. Triage

- Assign incident owner and severity:
  - **SEV-1**: active exploitation/data breach
  - **SEV-2**: confirmed vulnerability, no active exploit
  - **SEV-3**: suspicious event requiring investigation
- Capture timeline and affected systems.

## 3. Containment

- Rotate potentially exposed secrets immediately.
- Restrict vulnerable endpoint/routes if needed.
- Apply temporary WAF/rate-limiting rules.
- Freeze deployments if blast radius is unclear.

## 4. Eradication & Recovery

- Patch vulnerable code/config.
- Validate fix in staging.
- Deploy fix and monitor:
  - error rates
  - auth/validation failures
  - suspicious traffic patterns

## 5. Postmortem

- Document:
  - Root cause
  - Detection gaps
  - Time to detect / contain / recover
  - Follow-up actions with owners and due dates

## 6. Communications

- Internal updates at regular intervals.
- External disclosure if user impact exists.
- Coordinate CVE/advisory process where applicable.
