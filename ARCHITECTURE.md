# Fam-Care Architecture

## System Overview

This system manages **Leistungsnachweise** (service records) for German public healthcare (GKV). It allows care providers to:
1. Fetch client service records from a core server
2. Display documents to clients for review
3. Capture client signatures (digital, paper scan, photo, or missing)
4. Generate XSD-compliant XML documents for government healthcare billing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE SERVER                                     │
│                    (External - provides client data)                         │
│                         http://localhost:8081                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (Bearer token auth)
                                    │ GET /api/leistungsnachweise
                                    │ GET /api/leistungsnachweise/{id}
                                    │ POST /api/leistungsnachweise/{id}/sign
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOC-PROXY (Rust)                                  │
│                              Port: 3001                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Responsibilities:                                                           │
│  - Proxy requests to core server with service auth                          │
│  - Transform JSON to XSD-compliant XML (HKP_LNW_1.0.0.xsd)                 │
│  - Validate signatures and signature types                                   │
│  - Generate signed Leistungsnachweis documents                              │
│                                                                              │
│  Endpoints:                                                                  │
│  GET  /health                           - Health check                       │
│  GET  /leistungsnachweise?clientId=xxx  - List documents for client         │
│  GET  /leistungsnachweise/{id}          - Get document details              │
│  POST /leistungsnachweise/{id}/sign     - Sign document                     │
│       ?generateXml=true → Generate XML locally                              │
│       ?generateXml=false → Forward to core server                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (JSON)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOC-WEB-VIEW (Next.js)                               │
│                              Port: 3000                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Responsibilities:                                                           │
│  - Display documents to clients/patients                                     │
│  - Capture digital signatures via canvas                                     │
│  - Support batch signing of multiple documents                              │
│  - Mobile-responsive signature UI                                            │
│                                                                              │
│  Current Status: Uses local mock data and placeholder API                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Displayed to
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT/PATIENT                                  │
│                                                                              │
│  - Reviews service records (Leistungsnachweis)                              │
│  - Signs N documents with digital signature                                  │
│  - Signature types:                                                          │
│    1. Handwritten digital (canvas/tablet)                                   │
│    2. Handwritten paper (scanned)                                           │
│    3. Photo confirmation                                                     │
│    4. Alternative confirmation                                               │
│    5. Missing (with reason)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Document Retrieval
```
Frontend → GET /leistungsnachweise?clientId=xxx → Proxy → Core Server
                                                    ↓
Frontend ← JSON (LeistungsnachweisListItem[]) ← Proxy ← JSON
```

### 2. Document Display
```
Frontend → GET /leistungsnachweise/{id} → Proxy → Core Server
                                            ↓
Frontend ← JSON (LeistungsnachweisDetail) ← Proxy ← JSON

LeistungsnachweisDetail contains:
- Client info (Versichertennummer, Name, Vorname)
- Provider info (IK, responsible staff)
- Billing month (YYYYMM)
- Service days with deployments and individual services
- Signature status
```

### 3. Signature Submission
```
Frontend captures signature (PNG base64)
         ↓
POST /leistungsnachweise/{id}/sign
Body: {
  signatureType: "handwritten_digital" | "handwritten_paper" |
                 "photo_confirmation" | "alternative_confirmation" | "missing"
  signature: { data: "base64...", format: "png" }
  missingReason?: "unable_to_sign" | "refused" | "not_present" | "other"
  missingExplanation?: "..."
}
         ↓
Proxy validates request
         ↓
?generateXml=true                    ?generateXml=false
       ↓                                    ↓
Generate XSD-compliant XML          Forward to core server
Return XML + base64                 Return SignedDocumentResponse
```

### 4. XSD Schema Structure (HKP_LNW_1.0.0.xsd)
```xml
<Leistungsnachweis>
  <LeistungsnachweisID>uuid</LeistungsnachweisID>
  <ErbrachteLeistungen>
    <IK_Pflegedienst>...</IK_Pflegedienst>
    <Abrechnungsmonat>YYYYMM</Abrechnungsmonat>
    <Versichertennummer>...</Versichertennummer>
    <Name>...</Name>
    <Vorname>...</Vorname>
    <Leistungen>
      <Tag datum="YYYYMMDD">
        <Einsatz>
          <LaufendeNummer>1</LaufendeNummer>
          <UhrzeitBeginn>HHMM</UhrzeitBeginn>
          <Einzelleistung>
            <Leistungsziffer>...</Leistungsziffer>
            <Bezeichnung>...</Bezeichnung>
            <Anzahl>...</Anzahl>
            <TatsaechlicheDauer>minutes</TatsaechlicheDauer>
            <Beschaeftigtennummern>...</Beschaeftigtennummern>
          </Einzelleistung>
        </Einsatz>
      </Tag>
    </Leistungen>
  </ErbrachteLeistungen>
  <UnterschriftVersicherter>
    <Art>1-5</Art>
    <DatumUhrzeit>YYYYMMDDHHmmss</DatumUhrzeit>
    <Unterschrift>
      <Datei>base64</Datei>
      <Dateityp>1-5</Dateityp>
    </Unterschrift>
    <!-- OR -->
    <FehlendeUnterschrift>
      <Grund>1-4</Grund>
      <Erlaeuterung>...</Erlaeuterung>
    </FehlendeUnterschrift>
  </UnterschriftVersicherter>
</Leistungsnachweis>
```

## Technology Stack

### Backend (doc-proxy)
- **Language**: Rust 1.83
- **Framework**: Axum 0.8
- **ORM**: SeaORM 1.1 (PostgreSQL)
- **XML**: quick-xml for XSD serialization
- **HTTP Client**: reqwest for core server communication

### Frontend (doc-web-view)
- **Framework**: Next.js 16.1
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS, Radix UI
- **Animations**: Motion (Framer Motion)
- **Signatures**: react-signature-canvas

### Database
- PostgreSQL 18 (Alpine)
- Persisted via Docker volume

## Environment Variables

### doc-proxy
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | Required |
| CORE_API_URL | Core server base URL | http://localhost:8081 |
| CORE_API_TOKEN | Service auth token | dev-service-token |
| PORT | Server port | 3212 |

### doc-web-view
| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend proxy URL | http://backend:3000 |
| NEXT_PUBLIC_SIGNATURE_API_URL | Signature endpoint | /api/signature |

## Docker Services

```yaml
services:
  opz_db:        # PostgreSQL database (port 5432)
  backend:       # doc-proxy Rust server (port 3001)
  frontend:      # doc-web-view Next.js (port 3000)
```

## File Structure

```
fam-care/
├── docker-compose.yml
├── ARCHITECTURE.md
├── TODO.md
├── doc-proxy/                    # Rust backend
│   ├── Dockerfile
│   ├── Cargo.toml
│   ├── examples/                 # XSD schema files
│   │   ├── HKP_LNW_1.0.0.xsd    # Leistungsnachweis schema
│   │   └── ...
│   └── src/
│       ├── main.rs
│       ├── config/               # Router, middleware, database
│       ├── handlers/             # HTTP handlers
│       │   └── leistungsnachweis/
│       ├── services/             # Core client
│       ├── models/               # Data models, XSD types
│       └── domain/               # Business logic
└── doc-web-view/                 # Next.js frontend
    ├── Dockerfile
    ├── package.json
    ├── app/
    │   ├── page.tsx
    │   └── api/                  # Local API routes
    ├── components/               # React components
    ├── hooks/                    # Custom hooks
    ├── lib/                      # Utilities
    ├── types/                    # TypeScript types
    └── data/                     # Sample XML files
```
