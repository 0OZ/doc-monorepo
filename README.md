# Fam-Care

A system for managing **Leistungsnachweise** (service records) for German public healthcare (GKV). Care providers can fetch client service records, display them for review, capture signatures, and generate XSD-compliant XML documents for government healthcare billing.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Core Server   │────▶│    doc-proxy    │────▶│  doc-web-view   │
│   (External)    │     │     (Rust)      │     │   (Next.js)     │
│   Port: 8081    │     │   Port: 3001    │     │   Port: 3000    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Client/Patient │
                                                │   (Browser)     │
                                                └─────────────────┘
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- External network: `docker network create shared_ng`

### Run with Docker

```bash
docker compose up --build
```

Services will be available at:
- Frontend: http://localhost:31001
- Backend: http://localhost:2501
- Database: localhost:9132

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Rust 1.83, Axum 0.8, SeaORM |
| Frontend | Next.js 16.1, React 19, TypeScript |
| Database | PostgreSQL 18 |
| Styling | Tailwind CSS, Radix UI |

## Project Structure

```
fam-care/
├── docker-compose.yml
├── doc-proxy/           # Rust backend
│   ├── Dockerfile
│   ├── Cargo.toml
│   └── src/
└── doc-web-view/        # Next.js frontend
    ├── Dockerfile
    ├── package.json
    └── app/
```

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

## API Endpoints

### doc-proxy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /leistungsnachweise?clientId=xxx | List documents for client |
| GET | /leistungsnachweise/{id} | Get document details |
| POST | /leistungsnachweise/{id}/sign | Sign document |

## Signature Types

1. Handwritten digital (canvas/tablet)
2. Handwritten paper (scanned)
3. Photo confirmation
4. Alternative confirmation
5. Missing (with reason)

## Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture and data flow.
