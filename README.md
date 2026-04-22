# SIER Platform — No-Code Website Builder + Enterprise System

A comprehensive **Jimdo-like no-code website builder** with integrated **SIER** (Enterprise System) capabilities.

## Features

### 🏗 No-Code Page Builder
- Drag-and-drop UI components: Hero, Header, Text, Image, Video, Button, Card, Form, Table, Chart, Testimonial, Divider, Spacer
- Live property editing panel
- Page publish/draft workflow
- Real-time collaboration via WebSocket

### 🏢 SIER Modules
| Module | Features |
|--------|----------|
| **Back Office** | HR (employees, attendance), Finance (budgets, expenses) |
| **Front Office** | CRM (customers, deal pipeline), SFA |
| **Supply Chain** | Inventory management, low-stock alerts |
| **Operations** | Kanban task board, workflow management |
| **Governance** | Analytics overview, security/user management, audit logs, ESG metrics |

### 🔐 Enterprise Features
- JWT authentication (24h expiry)
- Multi-tenant isolation
- Role-based access control (admin / manager / user)
- Plugin system
- SQLite database (no external DB needed)

## Tech Stack

**Backend:** Node.js, Express, TypeScript, better-sqlite3, JWT, WebSocket (ws)

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, @hello-pangea/dnd, Recharts, Zustand, React Router 6

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env

# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 5173) — in another terminal
cd frontend && npm run dev
```

Open http://localhost:5173, register an account, and start building!

## Project Structure

```
├── backend/         # Node.js/Express API
├── frontend/        # React/TypeScript UI
├── docs/            # API and Development guides
└── docker-compose.yml
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) and [docs/API.md](docs/API.md) for details.