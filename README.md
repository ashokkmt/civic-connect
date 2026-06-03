# CivicConnect – Digital Civic Issue Reporting & Resolution Platform

A structured, transparent platform enabling citizens to report civic issues and empowering departments to resolve them efficiently. CivicConnect connects **Citizens** (reporting layer), **Departments** (resolution layer), and **Administrators** (governance layer) in a unified workflow with geo-clustering, moderation, SLA tracking, and escalation management.

## Table of Contents

- [Quick Start](#quick-start)
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Go** 1.21+
- **MongoDB** (local or Atlas)
- **Cloudinary** account (for image uploads)

### Backend Setup (Go)

```bash
cd backend

# Copy environment template and configure
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Cloudinary credentials

# Install dependencies and run
go mod download
go run ./cmd/api/main.go
```

Backend API runs on `http://localhost:8080` (default).

### Frontend Setup (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Create or update .env.local with:
# BACKEND_BASE_URL=http://localhost:8080

# Run development server
npm run dev
```

Frontend runs on `http://localhost:3000`.

---

## System Overview

### Core Concept

CivicConnect is a **moderation-first platform** where:

1. **Citizens** report civic issues with location and evidence (images)
2. **Administrators** review and approve submissions
3. **Department Heads** assign approved issues to field workers
4. **Field Authorities** execute resolution work
5. **Citizens** confirm resolution; **Department Heads** finalize closure

### Three Core Roles

| Role | Responsibilities |
|------|------------------|
| **Citizen** | Report issues, support nearby issues, monitor progress, confirm resolution |
| **Authority** (Department) | Head: Supervise, moderate, assign work. Worker: Execute resolution work |
| **Admin** | Review submissions, assign departments, manage users/departments, governance |

### Key Workflow

```
Issue Reported
    ↓
[PENDING_APPROVAL] — Admin/Head reviews
    ↓
[APPROVED] — Head assigns to worker
    ↓
[ASSIGNED] — Worker accepts assignment
    ↓
[IN_PROGRESS] — Worker executes work
    ↓
[RESOLVED] — Citizen confirms completion
    ↓
[AWAITING_HEAD_CLOSURE] — Head closes issue
    ↓
[CLOSED] — Issue resolved
```

### Public Transparency

Unauthenticated users can:
- Browse approved/public issues on a map
- View issue details
- See resolution progress

Actions requiring authentication:
- Submit issues
- Support existing issues
- Flag issues for review

---

## Architecture

### Three-Layer Backend Design

**HTTP Transport Layer** → **Service Layer (Business Logic)** → **Repository Layer (Persistence)**

```
├─ HTTP Handlers & Middleware (routing, auth, validation)
├─ Services (issue clustering, moderation, escalation, SLA tracking)
├─ Repositories (MongoDB interface abstractions)
├─ Domain (core entities and enums)
├─ Integrations (Cloudinary, JWT, geolocation)
└─ Storage (MongoDB connection)
```

### Key Backend Features

- **Geo-Clustering**: Issues within 50m radius are merged (prevents duplicates)
- **EXIF Validation**: GPS metadata validation (advisory, not blocking)
- **Moderation-First**: All issues start as `PENDING_APPROVAL`, invisible until approved
- **SLA & Escalation**: Deadline tracking per stage; automatic escalation when breached
- **Priority Scoring**: Issues ranked by age, supporter count, urgency, and geolocation
- **Anti-Abuse**: User blocking, rate limiting, duplicate flag prevention

### Frontend Architecture

**Next.js App Router** with route groups and API proxy pattern:

```
├─ (public)         — Home, issue browsing (no auth required)
├─ (auth)           — Login, register, password recovery
├─ (dashboard)      — Role-based dashboards (citizen, head, worker, admin)
├─ api/             — Backend proxy route handlers (internal only)
├─ components       - Shared UI
└─ lib              — Shared utilities
```

**Key Rules:**
- `/api/*` routes are **internal proxy only**; never user-facing
- All backend calls go through Next.js route handlers (no direct CORS to backend)
- JWT token stored securely in HTTP-only cookies
- Server Actions for mutations; Server Components for data fetching

---

## Technology Stack

### Backend

- **Language**: Go 1.21+
- **Database**: MongoDB (Atlas or local)
- **Image Storage**: Cloudinary
- **Authentication**: JWT (Bearer tokens)
- **Architecture**: Clean layered design with dependency injection

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Authentication**: JWT stored in HTTP-only cookies
- **Location**: Browser geolocation API + localStorage persistence

---

## Setup Instructions

### 1. Backend Configuration

#### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# HTTP Server
HTTP_PORT=8080

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DATABASE=civicconnect

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_TTL_MINUTES=1440

# Admin Registration
ADMIN_REGISTRATION_SECRET=your-admin-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_FOLDER=civicconnect/uploads

# Limits
UPLOAD_IMAGE_MAX_BYTES=5242880
SHUTDOWN_TIMEOUT_SEC=30
REQUEST_ID_HEADER=X-Request-Id
```

#### Running the Backend

```bash
cd backend
go mod download
go run ./cmd/api/main.go
```

API available at `http://localhost:8080`

**Test the backend:**
```bash
curl http://localhost:8080/api/v1/public/issues?lat=28.6139&lng=77.2090&radiusMeters=2000
```

### 2. Frontend Configuration

#### Environment Variables

Create `frontend/.env.local`:

```env
BACKEND_BASE_URL=http://localhost:8080
NEXT_PUBLIC_DEFAULT_RADIUS_METERS=2000
NEXT_PUBLIC_DEFAULT_ISSUE_LIMIT=100
```

#### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

UI available at `http://localhost:3000`

### 3. Database Initialization

MongoDB collections are auto-created on first API call with proper indexes. Ensure your `MONGODB_URI` points to an accessible MongoDB instance.

**Required collections:**
- `users` – Citizens, authorities, admins
- `issues` – Issue reports with status, location, metadata
- `flags` – Content moderation flags
- `departments` – Department entities

---

## Project Structure

```
civic/
├── backend/                           # Go REST API
│   ├── cmd/api/main.go               # Application entry point (DI wiring)
│   ├── internal/
│   │   ├── config/                   # Environment parsing
│   │   ├── domain/                   # Core entities (User, Issue, Department)
│   │   ├── https/                    # Routing, handlers, middleware
│   │   │   ├── router.go             # Route definitions
│   │   │   ├── handlers/             # HTTP handlers (thin layer)
│   │   │   └── middleware/           # Auth, rate limiting, validation
│   │   ├── service/                  # Business logic
│   │   │   ├── issue_service.go      # Issue lifecycle & clustering
│   │   │   ├── moderation_service.go # Authority Head review
│   │   │   ├── auth_service.go       # Authentication
│   │   │   ├── sla_service.go        # SLA & escalation
│   │   │   └── ...
│   │   ├── repository/               # Data access (MongoDB)
│   │   ├── integrations/cloudinary/  # Image upload client
│   │   ├── storage/                  # Database connection
│   │   ├── util/                     # JWT, geolocation, priority
│   │   └── errx/                     # Typed errors
│   └── .env.example                  # Environment template
│
├── frontend/                          # Next.js UI
│   ├── app/
│   │   ├── (public)/                 # Home, public issue browsing
│   │   ├── (auth)/                   # Login, register
│   │   ├── (dashboard)/              # Role-based dashboards
│   │   │   ├── dashboard/citizen/    # Citizen interface
│   │   │   ├── dashboard/authority-head/
│   │   │   ├── dashboard/authority-worker/
│   │   │   └── dashboard/admin/
│   │   └── api/                      # Backend proxy routes (internal only)
│   ├── components/                   # Shared UI components
│   ├── lib/                          # Utilities & helpers
│   ├── middleware.ts                 # RBAC enforcement
│   └── .env.example                  # Environment template
│
├── openapi.yaml                       # API contract specification (OpenAPI 3.0)
├── Makefile                           # Common commands
└── README.md                          # This file
```

---

## Key Features

### 1. Citizen Features
- **Report Issues**: Submit with location, title, description, and evidence (images)
- **Support Issues**: Upvote nearby issues to increase visibility
- **Monitor Progress**: Real-time status updates and timeline
- **Confirm Resolution**: Verify completed work
- **Flag Content**: Report inappropriate submissions

### 2. Department Head Features
- **Moderation Queue**: Review pending submissions with dedup clustering info
- **Approve/Reject**: Make governance decisions
- **Assign Work**: Route issues to field workers
- **Manage Workers**: Monitor team performance
- **SLA Oversight**: Track escalations and deadline breaches

### 3. Field Worker Features
- **Accept Assignments**: Manage work queue
- **Track Progress**: Update issue status as work progresses
- **Document Resolution**: Provide photos/notes of completed work
- **Confirm Closure**: Mark issues as resolved

### 4. Admin Features
- **System Governance**: Approve first submissions, set severity
- **User Management**: Register authorities, manage blocks
- **Department Management**: Create and configure departments
- **Analytics**: Monitor system performance and SLA metrics

---

## API Documentation

The backend API is fully documented in [openapi.yaml](openapi.yaml) (OpenAPI 3.0 specification). The specification includes:

- **Auth endpoints**: login, register, token refresh, profile retrieval
- **Public endpoints**: browse approved issues, view details
- **Citizen endpoints**: submit issues, support/upvote, flag content, confirm resolution
- **Authority Head endpoints**: review pending issues, approve/reject, assign workers, manage escalations
- **Authority Worker endpoints**: list assigned work, update progress, mark as resolved
- **Admin endpoints**: manage users, departments, system governance
- **Upload endpoints**: submit images with multipart form data

To view the API in a browser, use [Swagger UI](https://swagger.io/tools/swagger-ui/) or import the YAML into [Postman](https://www.postman.com/).

---

## Running Both Services

### Option 1: Separate Terminals

**Terminal 1 – Backend:**
```bash
cd backend && go run ./cmd/api/main.go
```

**Terminal 2 – Frontend:**
```bash
cd frontend && npm run dev
```

### Option 2: Using Make (if available)

```bash
# Check Makefile for available targets
make help

# Run both services
make dev
```

---


## Development Workflow

1. **Backend First**: Ensure API runs and returns sample data
2. **Frontend Integration**: Build page layouts, then wire to backend endpoints
3. **Authentication**: Test login flow end-to-end
4. **Role-Based UX**: Verify each role sees correct interface
5. **Testing**: Use Postman collection or curl for API verification

---

## Troubleshooting

### Backend won't start
- Check MongoDB connection in `.env`
- Verify `JWT_SECRET` is at least 32 characters
- Ensure port 8080 is available

### Frontend can't reach backend
- Verify `BACKEND_BASE_URL` in `.env.local`
- Check CORS headers from backend (route handlers proxy to backend)
- Ensure both services are running

### Image upload fails
- Verify Cloudinary credentials in backend `.env`
- Check `UPLOAD_IMAGE_MAX_BYTES` limit
- Ensure `CLOUDINARY_UPLOAD_FOLDER` path exists in Cloudinary

---

## Contributing

- Follow the layered architecture: HTTP → Service → Repository
- Add tests for new service logic
- Update documentation when adding features
- Keep backend and frontend in sync

---

## License

TBD
