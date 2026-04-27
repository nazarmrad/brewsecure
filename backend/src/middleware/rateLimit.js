// VULN: No Rate Limiting — this middleware is intentionally a no-op.
// The login endpoint is left completely unthrottled to demonstrate credential
// stuffing and brute-force attack surfaces for Akamai demo purposes.
//
// Akamai controls that address this:
//   - Bot Manager: detects automated login traffic via behavioral fingerprinting
//   - Account Protector: identifies ATO patterns (velocity, IP reputation, device signals)
//   - App & API Protector: rate-limiting rules can be toggled per endpoint in policy

function noRateLimit(_req, _res, next) {
  // Intentionally empty — no throttle applied
  next()
}

module.exports = { noRateLimit }
