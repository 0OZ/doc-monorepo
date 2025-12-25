# Integration TODO

## Critical Issues

### 1. Frontend-Backend Disconnected
**Status**: Not integrated
**Priority**: High

The frontend (`doc-web-view`) and backend (`doc-proxy`) are not connected:
- Frontend reads from local `/data/*.xml` files
- Frontend submits signatures to placeholder `/api/signature` (local Next.js route)
- Backend expects to proxy requests to a core server

**Tasks**:
- [ ] Connect frontend to backend API at `http://backend:3000` (Docker) or `http://localhost:3001` (local)
- [ ] Update `useDocumentLoader` hook to fetch from proxy API
- [ ] Update `signature-service.ts` to POST to proxy sign endpoint
- [ ] Remove or repurpose local mock API routes

### 2. Data Model Mismatch
**Status**: Incompatible schemas
**Priority**: High

Frontend uses **FHIR Composition** structure:
```typescript
interface ParsedDocument {
  composition: FHIRComposition;
  patient: FHIRPatient;
  practitioner: FHIRPractitioner;
  sections: FHIRSection[];
}
```

Backend returns **Leistungsnachweis** structure:
```typescript
interface LeistungsnachweisDetail {
  id: string;
  client: { versichertennummer, name, vorname };
  provider: { ik, responsible_staff_id };
  billing_month: string;
  service_days: ServiceDayResponse[];
  signature: SignatureInfo;
}
```

**Tasks**:
- [ ] Decide on unified data model (FHIR or Leistungsnachweis)
- [ ] Create adapter/transformer layer if both needed
- [ ] Update frontend types to match backend response
- [ ] Update frontend components to render Leistungsnachweis data

### 3. Missing Core Server
**Status**: Not implemented
**Priority**: High

The proxy expects to communicate with an upstream core server:
- `CORE_API_URL` environment variable
- `CORE_API_TOKEN` for service authentication
- Endpoints: `/api/leistungsnachweise`, `/api/leistungsnachweise/{id}`, `/api/leistungsnachweise/{id}/sign`

**Tasks**:
- [ ] Implement mock core server for development
- [ ] Or implement local data storage in proxy (bypass core server mode)
- [ ] Document core server API contract

### 4. Signature Payload Format
**Status**: Mismatch
**Priority**: Medium

Frontend sends:
```typescript
interface SignaturePayload {
  documentId: string;
  signatureImage: string;  // data:image/png;base64,...
  timestamp: string;
  signerName?: string;
  signerRole?: "patient" | "guardian" | "witness" | "provider";
}
```

Backend expects:
```typescript
interface SignLeistungsnachweisRequest {
  signature_type: "handwritten_digital" | "handwritten_paper" |
                  "photo_confirmation" | "alternative_confirmation" | "missing";
  signature?: {
    data: string;     // base64 without prefix
    format: "png" | "jpeg" | "svg" | "gif" | "tiff" | "pdf";
  };
  missing_reason?: "unable_to_sign" | "refused" | "not_present" | "other";
  missing_explanation?: string;
}
```

**Tasks**:
- [ ] Update frontend signature submission to match backend format
- [ ] Strip `data:image/png;base64,` prefix before sending
- [ ] Add signature type selection UI (currently hardcoded as handwritten digital)
- [ ] Add missing signature flow with reason selection

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
**Status**: Inconsistent
**Priority**: Low

- Dockerfile exposes 3000
- main.rs defaults to 3212
- docker-compose maps 3001:3000

**Tasks**:
- [ ] Standardize port configuration
- [ ] Use PORT env var consistently

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

1. **Fix proxy port**: Update `main.rs` to bind to `0.0.0.0:3000` for Docker compatibility
2. **Add health check to frontend**: `GET /api/health` endpoint
3. **Environment file**: Create `.env.example` with all required variables
4. **CORS**: Verify CORS is properly configured for frontend origin
