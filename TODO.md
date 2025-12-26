# Integration TODO

## Completed

### 1. Frontend-Backend Connected
**Status**: DONE

- [x] Connect frontend to backend API at `http://backend:3000` (Docker) or `http://localhost:3001` (local)
- [x] Update `useDocumentLoader` hook to fetch from proxy API
- [x] Created `lib/api.ts` for backend communication
- [x] Frontend now uses `NEXT_PUBLIC_API_URL` environment variable

### 2. Data Model Unified
**Status**: DONE

- [x] Created `types/leistungsnachweis.ts` with full Leistungsnachweis types
- [x] Updated all frontend components to use Leistungsnachweis structure
- [x] Created `LeistungsnachweisViewer` component to display service records
- [x] Updated hooks: `use-document-loader`, `use-multi-document-handler`, `use-batch-sign`
- [x] Updated components: `document-signing-page`, `batch-sign-modal`, `document-navigation`

### 3. Mock Mode Implemented
**Status**: DONE

- [x] Added `MOCK_MODE` environment variable to doc-proxy (defaults to true)
- [x] Created `services/mock_data.rs` with sample Leistungsnachweise
- [x] Mock mode returns sample client data without needing core server

### 4. Authentication Implemented
**Status**: DONE

- [x] Backend JWT authentication with `jsonwebtoken` crate
- [x] Created `config/auth.rs` with Claims, AuthUser extractor
- [x] Created `handlers/auth.rs` with login, logout, refresh, me endpoints
- [x] Auth middleware validates JWT tokens on protected routes
- [x] Mock users for development: admin/admin123, staff/staff123, client/client123
- [x] Frontend `lib/auth.ts` with login, logout, token management
- [x] Frontend login page at `/login`
- [x] API client includes auth headers automatically
- [x] 401 responses trigger logout and redirect to login
- [x] Environment variables: `JWT_SECRET`, `AUTH_DISABLED`

### 5. Signature Payload Fixed
**Status**: DONE

- [x] Created `createSignRequest()` helper in `lib/api.ts`
- [x] Strips `data:image/png;base64,` prefix automatically
- [x] Maps to backend `SignLeistungsnachweisRequest` format
- [x] Defaults to `handwritten_digital` signature type

### 6. Device Auto-Authentication
**Status**: DONE

- [x] Backend device entity and repository (`repositories/entity/device.rs`, `repositories/device_repository.rs`)
- [x] Device auth endpoint `POST /auth/device` - exchanges X-Device-Key header for JWT
- [x] Device management endpoints (admin only): `/devices` CRUD operations
- [x] Database migration for devices table (`migrations/001_create_devices.sql`)
- [x] Next.js middleware for auto-auth via X-Device-Key header
- [x] Frontend auth supports both localStorage (manual login) and httpOnly cookies (device auth)
- [x] API keys are hashed with Argon2, shown once on device registration
- [x] Devices can be activated/deactivated, API keys can be regenerated

---

## Remaining Tasks

---

## Medium Priority

### 7. Database Not Used
**Status**: Connected but unused
**Priority**: Medium

PostgreSQL is configured but the proxy currently:
- Only proxies to core server
- Doesn't persist anything locally
- Has repository structure but unused

**Tasks**:
- [ ] Run device migration (`migrations/001_create_devices.sql`)
- [ ] Decide what else to persist locally (signatures? audit logs?)
- [ ] Implement additional repository methods

### 8. Port Configuration
**Status**: FIXED
**Priority**: Low

- [x] Updated main.rs to default to port 3000 and bind to 0.0.0.0
- [x] Dockerfile exposes 3000
- [x] docker-compose maps 3001:3000 (backend accessible at localhost:3001)

---

## Enhancement Ideas

### 9. Offline Support
Consider PWA capabilities for mobile signature capture without network.

### 10. PDF Preview
Generate PDF preview of Leistungsnachweis before signing.

### 11. Audit Trail
Store signature events with timestamps, IP, device info.

### 12. XML Validation
Validate generated XML against XSD schema before returning.

---

## Quick Wins

1. ~~**Fix proxy port**: Update `main.rs` to bind to `0.0.0.0:3000` for Docker compatibility~~ DONE
2. ~~**Add health check to frontend**: `GET /api/health` endpoint~~ DONE
3. ~~**Environment file**: Create `.env.example` with all required variables~~ DONE
4. ~~**CORS**: Configurable CORS via `CORS_PERMISSIVE` and `CORS_ALLOWED_ORIGINS`~~ DONE
