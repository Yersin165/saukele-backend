# Changelog

## v1.0.0 — Pre-defense release

No deviations from `openapi.yaml`. All implemented endpoints match the
contract exactly in method, path, request body, and response shape.

### Business logic notes
- Exchange rates are intentionally stubbed (`KZT: 1`, `USD: 450`).
  `EXCHANGE_RATE_API_KEY` is reserved for a future live-rate integration.