# VASTUCRAFT AI — Database Setup & Architecture Guide

This document provides complete instructions for configuring, initializing, migrating, and verifying the relational database powering **VASTUCRAFT AI** (PostgreSQL / SQLite with SQLAlchemy ORM).

---

## 🏛️ Database Architecture Overview

VASTUCRAFT AI uses **SQLAlchemy ORM** to manage relational tables for projects, architectural floor plan candidates, placed rooms, structural grids, column/beam framing, steel rebar specifications, and OpenCV computer vision upload results.

```
┌─────────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│     ProjectDB       │1    * │   FloorPlanDB        │1    * │    PreliminaryStruct   │
│  (plot, setbacks)   ├──────►│ (fitness, vastu score├──────►│(columns, beams, rebars)│
└─────────────────────┘       └──────────┬───────────┘       └────────────────────────┘
                                         │
                                         │1
                                         ▼*
                              ┌──────────────────────┐
                              │     LayoutRoomDB     │
                              │ (x, y, width, length)│
                              └──────────────────────┘
```

---

## ⚙️ 1. Environment Configuration

The application supports both local lightweight **SQLite** (default for development) and enterprise **PostgreSQL**.

Create or update `.env` in the `backend/` directory:

```ini
# Backend Environment Configuration
PROJECT_NAME="VASTUCRAFT AI API"
VERSION="1.0.0"
API_V1_STR="/api/v1"
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# Database URL Option A: SQLite (Default)
DATABASE_URL="sqlite:///./vastucraft.db"

# Database URL Option B: PostgreSQL (Production)
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/vastucraft_db"
```

---

## 🗄️ 2. Step-by-Step SQLite Setup (Default / Quick Start)

SQLite requires zero installation and creates `backend/vastucraft.db` automatically on application startup.

### Step 2.1: Initialize SQLite Database
Run the Python database table initialization script:

```bash
cd backend
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine); print('Database tables created successfully!')"
```

---

## 🐘 3. Step-by-Step PostgreSQL Setup (Production)

### Step 3.1: Install & Start PostgreSQL
1. Download PostgreSQL from [postgresql.org/download](https://www.postgresql.org/download/).
2. Start PostgreSQL service and open `psql` shell:
   ```bash
   psql -U postgres
   ```

### Step 3.2: Create Database & User
Run the following SQL commands in `psql`:

```sql
CREATE DATABASE vastucraft_db;
CREATE USER vastucraft_user WITH PASSWORD 'securepassword123';
GRANT ALL PRIVILEGES ON DATABASE vastucraft_db TO vastucraft_user;
\q
```

### Step 3.3: Install psycopg2 Dependency
Ensure PostgreSQL driver is installed in your Python environment:

```bash
pip install psycopg2-binary
```

### Step 3.4: Configure Backend Connection String
In `backend/.env`, set:

```ini
DATABASE_URL="postgresql://vastucraft_user:securepassword123@localhost:5432/vastucraft_db"
```

---

## 🔄 4. Database Migrations (Alembic)

To manage database schema evolution and migrations:

### Step 4.1: Initialize Alembic
```bash
cd backend
alembic init alembic
```

### Step 4.2: Generate Automatic Migration
```bash
alembic revision --autogenerate -m "Initial VASTUCRAFT AI schema"
```

### Step 4.3: Apply Migration
```bash
alembic upgrade head
```

---

## 🧪 5. Database Verification

Verify database tables and connections by running backend pytest unit tests:

```bash
cd backend
python -m pytest tests
```

Expected output:
```
collected 14 items
tests/test_genetic_solver.py . PASSED
tests/test_geometry.py .... PASSED
tests/test_steel.py ... PASSED
tests/test_structure.py . PASSED
tests/test_vastu.py . PASSED
tests/test_vision.py .... PASSED
================ 14 passed in 0.68s ================
```
