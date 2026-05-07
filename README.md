<div align="center">

<img src="./frontend/public/assets/img/AGAILA.png" alt="AGAILA Logo" width="200px" /><br />

# AGAILA: Geospatial AI-driven Assessment

**AI-powered real-time environmental hazard detection and geospatial visualization for disaster response in the Philippines**

[![Build Status](https://img.shields.io/badge/Build-Passing-success?style=flat-square)](https://github.com/AlexisRellon/AGAILA/actions)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![DigitalOcean](https://img.shields.io/badge/DigitalOcean-Deployment-008BCF?style=flat-square&logo=digitalocean&logoColor=white)](https://www.digitalocean.com)
[![CodeQL](https://img.shields.io/badge/CodeQL-Scanning-informational?style=flat-square)](https://github.com/AlexisRellon/AGAILA/security/code-scanning)
[![License](https://img.shields.io/badge/License-TBD-yellow?style=flat-square)](#license)

[Overview](#overview) • [Features](#features) • [Getting Started](#getting-started) • [Architecture](#architecture) • [Deployment](#deployment) • [Resources](#resources)

</div>

---

## Overview

AGAILA is a real-time environmental hazard detection and visualization system designed for the Philippines. The system automatically processes news feeds and citizen reports to detect, classify, and map environmental hazards including typhoons, floods, earthquakes, landslides, and wildfires.

Using advanced AI models (Zero-Shot Classification with Climate-NLI and Geospatial Named Entity Recognition) combined with PostGIS validation, AGAILA provides disaster management agencies, local government units (LGUs), and emergency responders with actionable intelligence to support rapid response and resource allocation.

> **Target Time-to-Action**: Less than 5 minutes from article publication to hazard visualization on the interactive map.

## Features

**AI & Detection**
- Zero-Shot Classification using Climate-NLI for hazard type detection without extensive training data
- Custom Geospatial Named Entity Recognition (Geo-NER) extracts Philippine location names from unstructured text
- Multi-lingual support handles code-switching between English, Tagalog, and regional dialects
- Confidence scoring provides uncertainty quantification for all AI predictions

**Real-Time Monitoring**
- Automatic RSS feed aggregation from Philippine news outlets (GMA News, ABS-CBN, Inquirer.net)
- Supabase Realtime pushes new hazards instantly to the map
- Asynchronous background processing via Celery workers maintains API responsiveness

**Interactive Visualization**
- Progressive Web App (PWA) with offline capability and responsive design
- Leaflet-powered interactive maps with dynamic marker clustering
- Advanced filtering by hazard type, region, time window, and data source
- Heatmap visualization for high-concentration hazard areas

**Citizen Engagement**
- Public hazard reporting with spam-protection options and moderation workflows
- Image upload support with automatic geotag extraction
- Manual triage workflow for low-confidence AI predictions
- Tracking system for citizen-submitted reports

**Administrative Capabilities**
- Report validation and manual triage dashboard
- Role-based access control (Master Admin, Validator, LGU Responder)
- Complete activity and audit logging for compliance
- Analytics dashboard with performance metrics and trend analysis

## Getting Started

### Prerequisites

**For Docker Development (Recommended)**
- [Docker Desktop](https://www.docker.com/products/docker-desktop) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) V2+
- [Git](https://git-scm.com/downloads)

**For Local Development**
- [Node.js](https://nodejs.org/) 20 LTS or later
- [Python](https://www.python.org/downloads/) 3.9+
- [PostgreSQL](https://www.postgresql.org/download/) 14+ with PostGIS extension
- [Git](https://git-scm.com/downloads)

### Quick Start (Docker)

The fastest way to get AGAILA running locally:

```bash
# Clone the repository
git clone https://github.com/AlexisRellon/AGAILA.git
cd AGAILA

# Copy and configure environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your Supabase credentials:
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Start all services with Docker Compose
docker-compose up --build
```

**Services will be available at:**
- Frontend PWA: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

> [!TIP]
> For detailed local setup without Docker, see the repository setup guides.

## Deployment

AGAILA supports multiple deployment options optimized for scalability and cost-efficiency:

### Option 1: Vercel + DigitalOcean (Recommended)

Best for teams that want global CDN performance for the frontend and a managed container host for backend workloads.

- **Frontend**: Vercel (Global CDN)
- **Backend**: DigitalOcean App Platform or DigitalOcean Droplets (Docker)
- **Database**: Supabase (Managed PostgreSQL + PostGIS)

```bash
# Deploy frontend to Vercel
cd frontend
vercel --prod

# Example backend flow: build and push Docker image, then deploy on DigitalOcean
docker build -t registry.digitalocean.com/<registry>/agaila-backend:latest -f Dockerfile.backend .
doctl registry login
docker push registry.digitalocean.com/<registry>/agaila-backend:latest
# Deploy via DigitalOcean App Platform or use a Droplet with Docker Compose
```

### Option 2: DigitalOcean Only

Run all services on DigitalOcean using App Platform, Managed Databases, and Managed Redis, or use Droplets and Docker Compose for more control.

- **All Services**: DigitalOcean (App Platform or Droplets)
- **Database**: Supabase (Managed PostgreSQL + PostGIS) or DigitalOcean Managed Databases

```bash
# Example: use DigitalOcean App Platform or Droplets to host services
# See DigitalOcean documentation and the `doctl` CLI for deployment commands
doctl apps create --spec app.yaml
```

For complete deployment instructions including environment variables, database setup, and custom domains, consult the project's internal deployment documentation or contact the maintainers.

## Architecture

### System Design

AGAILA follows a three-tiered architecture optimized for real-time processing, scalability, and reliability:

**1. Data Ingestion Layer**
- RSS aggregation via Celery Beat (hourly scheduler)
- Citizen report submission API with optional spam-protection integrations and moderation workflow
- Reference data: Philippine administrative boundaries

**2. Core Processing (AI Pipeline)**
```
Raw Text → Preprocessing (spaCy) → Climate-NLI (Hazard Detection)
→ Geo-NER (Location Extraction) → PostGIS Validation → Storage
```

Output format: `{HazardType, Latitude, Longitude, ConfidenceScore}`

Key features:
- Only processes events within Philippine administrative boundaries
- Flags low-confidence predictions (<0.7) for manual triage
- Asynchronous processing maintains API responsiveness

**3. Presentation Layer**
- React 18 with TypeScript for type-safe development
- TailwindCSS + ShadCN UI for modern, accessible components
- Leaflet for interactive geospatial visualization
- React Query for efficient data fetching
- Zustand for lightweight state management

### Service Deployment

**Vercel + DigitalOcean (Recommended)**
```
┌────────────────────────────────────────────────────┐
│ Frontend (Vercel CDN) → Backend (DigitalOcean App) │
│                                      ↓              │
│                       Redis (Managed) → Cache      │
│                       Celery Workers (Droplets)    │
└────────────────────────────────────────────────────┘
```

**DigitalOcean Only**
```
┌────────────────────────────────────────────────────┐
│ All Services on DigitalOcean (App Platform/Droplets)
│ Frontend (CDN) → Backend (Docker) → Redis → DB     │
│                     ↓          ↓                    │
│              Celery Workers  Cache                 │
└────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, TailwindCSS, Leaflet, ShadCN UI |
| **Backend** | Python 3.9+, FastAPI, Transformers (Climate-NLI), spaCy (Geo-NER) |
| **Data** | Supabase (PostgreSQL + PostGIS), Supabase Realtime |
| **Cache & Tasks** | Redis, Celery, Celery Beat |
| **Deployment** | Docker, Docker Compose, DigitalOcean, Vercel |

## Resources

### Documentation
- Project documentation, checklists, and research artifacts are maintained internally; contact the maintainers for access and the latest copies.

### Deployment & Setup
- Deployment and setup guides (platform-specific instructions, environment variables, and database configuration) are available in internal documentation or from the maintainers.

### Security & Best Practices
- Security scanning and audit guidance is maintained in-repo; run dependency and DAST/SCA scans as part of CI and follow the repository security guide.

### Development Guides
- Contributor and development guides (OpenSpec workflow, frontend/backend guidelines) are available internally—see maintainers for access.

## Development

### Module Codes

Use these codes in branch names and commit messages for organization:

```
AUTH-0x    Authentication/Registration
CD-01      Dashboard/Command Interface
GV-0x      Geospatial Visualization (maps, markers, heatmaps)
FP-0x      Filtering Panel (hazard/region/time/source)
RG-0x      Report Generation (CSV, GeoJSON, PDF)
AC-0x      Admin Console (logs, triage, config)
CR-0x      Citizen Report (submission, validation)
UM-0x      User Management (RBAC)
RSS-0x     RSS Feed Integration
AAM-0x     Advanced Analytics
EDI-0x     External Data Integration
```

### Git Workflow

**Branch naming convention:**
```bash
feature/GV-04-heatmap-density
fix/CR-03-spam-protection-timeout
chore/docs-update
```

**Commit messages:**
```bash
git commit -m "feat(GV-02): add dynamic marker refresh"
git commit -m "fix(CR-03): handle spam-protection timeout"
git commit -m "docs: update deployment instructions"
```

### Common Commands

**Local Development**
```bash
# Start all services
docker-compose up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run tests
docker-compose run backend pytest tests/python/ --cov
docker-compose run frontend npm test --coverage

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh
```

**Production Deployment**
```bash
# Example: deploy backend image to DigitalOcean Container Registry and App Platform
docker build -t registry.digitalocean.com/<registry>/agaila-backend:latest -f Dockerfile.backend .
doctl registry login
docker push registry.digitalocean.com/<registry>/agaila-backend:latest
# Create or update an App Platform app that references your pushed image, or deploy to a Droplet with Docker Compose

# Deploy frontend to Vercel
cd frontend && vercel --prod
```

## Contributing

This project welcomes contributions! Please follow these guidelines:

1. **Check existing work** - Review the internal module checklist to see what's in progress (contact maintainers for access)
2. **Read specifications** - See [openspec/project.md](openspec/project.md) for architecture and conventions
3. **Create a proposal** - For new features, see [openspec/AGENTS.md](openspec/AGENTS.md)
4. **Follow code style** - Use provided linting and formatting configs
5. **Write tests** - Ensure test coverage for new code
6. **Document changes** - Update the project's internal documentation as needed (maintainers will advise)

> [!NOTE]
> Before making major changes, open an issue to discuss your approach. This helps avoid duplicate work and ensures alignment with project goals.

## Testing

**Unit & Integration Tests**
```bash
# Backend Python tests
docker-compose run backend pytest tests/python/ --cov=backend/python

# Frontend tests
docker-compose run frontend npm test

# Frontend coverage report
docker-compose run frontend npm run test:coverage
```

**Security Testing**
Run automated dependency and security scans using your preferred tooling (Snyk, GitHub CodeQL, OWASP ZAP, etc.) and follow the repository security guide.

## Troubleshooting

**Docker Setup Issues**
- Ensure Docker Desktop is running: `docker ps`
- Clear Docker cache: `docker system prune -a`
- Check service logs: `docker-compose logs -f backend`

**API Connection Errors**
- Verify Supabase credentials in `backend/.env`
- Check CORS configuration in backend
- Use container service names (not localhost) for inter-service communication

**Frontend Build Issues**
- Clear cache and reinstall: `rm -rf frontend/node_modules && cd frontend && npm install`
- Check TypeScript: `cd frontend && npm run lint`

For detailed help, consult the project's internal setup guides or contact the maintainers for deployment instructions.

## Learning Resources

- Thesis and research outputs are included in the project's internal documentation; contact the maintainers for access.
- **[Supabase Docs](https://supabase.com/docs)** - PostgreSQL and PostGIS setup
- **[FastAPI Docs](https://fastapi.tiangolo.com/)** - Backend API development
- **[React Documentation](https://react.dev/)** - Frontend framework guide
- **[Leaflet Maps](https://leafletjs.com/)** - Interactive mapping library
- DigitalOcean documentation has details for App Platform, Droplets, and Container Registry (see digitalocean.com/docs)

## Project Status

**Current Phase**: Production-ready with active development

**Completed** ✅
- Authentication & Authorization (AUTH-01, AUTH-02)
- Dashboard & Command Interface (CD-01)
- Geospatial Visualization (GV-01 to GV-04)
- Advanced Filtering (FP-01 to FP-04)
- Report Generation (RG-01 to RG-03)
- Admin Console (AC-01 to AC-04)
- Citizen Reporting (CR-01 to CR-07)

<!-- **In Progress** 🚧
- Advanced Analytics (AAM)
- External Data Integration (EDI)

See the internal module checklist for detailed status (contact maintainers). -->

---

<div align="center">

**Built with dedication for disaster resilience and community safety**

[Report Issue](https://github.com/AlexisRellon/AGAILA/issues) • [Request Feature](https://github.com/AlexisRellon/AGAILA/issues) • View project documentation (internal)

</div>
