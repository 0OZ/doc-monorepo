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

### 4. Signature Payload Fixed
**Status**: DONE

- [x] Created `createSignRequest()` helper in `lib/api.ts`
- [x] Strips `data:image/png;base64,` prefix automatically
- [x] Maps to backend `SignLeistungsnachweisRequest` format
- [x] Defaults to `handwritten_digital` signature type

---

## Remaining Tasks

---

## Medium Priority

### 5. Authentication Missing
**Status**: Placeholder only
**Priority**: Medium

- Backend has `auth_middleware` placeholder
- Frontend has no auth implementation
- No user context or session management

**Tasks**:
- [ ] Implement proper auth middleware in proxy
- [ ] Add auth to frontend (login, session)
- [ ] Pass auth headers from frontend to proxy

### 6. Database Not Used
**Status**: Connected but unused
**Priority**: Medium

PostgreSQL is configured but the proxy currently:
- Only proxies to core server
- Doesn't persist anything locally
- Has repository structure but unused

**Tasks**:
- [ ] Decide what to persist locally (signatures? audit logs?)
- [ ] Run migrations
- [ ] Implement repository methods

### 7. Port Configuration
**Status**: FIXED
**Priority**: Low

- [x] Updated main.rs to default to port 3000 and bind to 0.0.0.0
- [x] Dockerfile exposes 3000
- [x] docker-compose maps 3001:3000 (backend accessible at localhost:3001)

---

## Enhancement Ideas

### 8. Offline Support
Consider PWA capabilities for mobile signature capture without network.

### 9. PDF Preview
Generate PDF preview of Leistungsnachweis before signing.

### 10. Audit Trail
Store signature events with timestamps, IP, device info.

### 11. XML Validation
Validate generated XML against XSD schema before returning.

---

## Quick Wins

1. ~~**Fix proxy port**: Update `main.rs` to bind to `0.0.0.0:3000` for Docker compatibility~~ DONE
2. [ ] **Add health check to frontend**: `GET /api/health` endpoint
3. ~~**Environment file**: Create `.env.example` with all required variables~~ DONE
4. [ ] **CORS**: Verify CORS is properly configured for frontend origin
