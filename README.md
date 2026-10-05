# VastuPlan AI 🏛️
### Artificial Intelligence-Powered Architectural Floor Planning, Vastu Shastra Analysis & 3D Structural Steel Detailing System

[![Python Version](https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r174-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 🌟 Executive Overview

**VastuPlan AI** is an advanced end-to-end full-stack CAD/BIM web application designed to automate residential floor plan generation, ancient **Vastu Shastra** architectural optimization, interactive **3D BIM visualization**, **MEP (Plumbing & Electrical) routing**, and **IS 456 / SP 34 Structural Steel Rebar Detailing**.

The platform translates user plot configurations and room requirements into optimized architectural layouts while computing preliminary structural beam-column frames, 3D Fe500 steel rebar cages, and automated Bar Bending Schedules (BBS).

---

## ✨ Key Features & Capabilities

### 1. 🧬 AI Floor Plan Solver & Diversity Engine
- Multi-candidate plan solver evaluating spatial efficiency, circulation, daylighting, and structural alignment.
- Layout Diversity Engine ensuring distinct geometric configurations (e.g., Central Corridor, Courtyard-Centric, Open Concept).
- Multi-storey layout capabilities (supporting Ground Floor up to 10 floors with vertical staircase stacks).

### 2. ☯️ Vastu Shastra Compliance Engine
- Automated 81-Pada Vastu Purusha Mandala spatial grid calculation.
- Zone orientation analysis across 9 primary directions (**N, NE, E, SE, S, SW, W, NW, CENTER / Brahmasthan**).
- Quantitative Vastu scoring with category breakdowns, positive observations, rule violations, and actionable recommendations.

### 3. 🏗️ Interactive 3D Steel Mapping & Rebar Inspector Studio
- **Beam-to-Bar Relationship Mapping**: Clear structural hierarchy (`Beam B1` → `B1-01` Bottom Tension Bar, `B1-02` Top Support Bar, `B1-03` Shear Stirrups).
- **3D Fe500 Rebar Cages**: High-precision 3D steel mesh rendering with dynamic top/bottom bar counts and stirrup loop spacing.
- **Glowing Selection Highlighting**: Selecting any bar mark (`B1-01`, `C1-01`, `S1-01`) highlights the exact rebar group in WebGL with glowing emissive intensity.
- **Real-Time 3D Exploded View**: Smooth 0% to 100% vertical & horizontal explosion controller allowing un-occluded inspection of internal beam/column reinforcement cages.
- **3D Angle Orientation Correction**: Renders beams at exact 3D rotation angles ($\theta = -\arctan2(\Delta Z, \Delta X)$), preventing floating or misaligned bars.

### 4. 📊 Automated Bar Bending Schedule (BBS) & Steel Takeoff
- Instant calculation of total steel tonnage using standard unit weight formulas:
  $$W = \frac{D^2}{162.2} \times L$$
- Comprehensive table breakdown: `| Bar ID | Beam ID | Type | Position | Diameter | Quantity | Spacing | Cut Length | Total Weight |`.
- Single-click **CSV export** for engineering takeoff reports.

### 5. ✏️ 2D CAD Editor & Section Details
- Interactive 2D floor plan editor with wall snapping, grid alignment, and room manipulation tools.
- 2D CAD cross-section drawings for RC Columns, RC Beams, Slabs, and Footings with IS 456 / SP 34 compliance callouts.

### 6. 🚰 MEP (Plumbing & Electrical) Planning Engine
- Automated wet-room shaft placement (kitchen, toilet, utility stack alignment).
- Pipe routing optimization (Water supply, Wastewater, Soil drain) with bend and junction count minimization.
- Electrical point placement (light points, switchboards, AC points, main DB panels) and total power load estimation ($kW$).

### 7. 📷 Computer Vision Blueprint Scanner
- OpenCV-powered blueprint scanner allowing users to upload 2D raster floor plan images.
- Automatic detection of perimeter walls, room bounding boxes, columns, door openings, and pixel-to-meter scale calibration.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI/UX** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Zustand State Store |
| **3D Rendering Engine** | Three.js, React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`) |
| **Backend Services** | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy, NumPy |
| **Computer Vision Engine** | OpenCV (`opencv-python`), Pillow, SciPy |
| **Testing & Build** | Pytest, TypeScript Compiler (`tsc`), Vite Bundler |
| **Database** | SQLite (`vastu_planner.db`) |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Python**: `v3.10` to `v3.13`
- **npm** or **yarn**

---

### 1. Clone the Repository
```bash
git clone https://github.com/Devendra005/Floor-Planning-Using-Ai.git
cd Floor-Planning-Using-Ai
```

---

### 2. Backend Setup & Run

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows**:
     ```cmd
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API docs will be accessible at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 3. Frontend Setup & Run

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Running Tests & Build Verification

### Run Backend Unit Tests (Pytest)
```bash
# From project root directory with virtual environment activated
.\venv\Scripts\python -m pytest backend/tests
```

### Run Frontend Type Check & Production Build
```bash
# From frontend directory
npx tsc --noEmit
npm run build
```

---

## 📐 Structural Beam-Bar Mapping Standard

In the **Steel & Reinforcement Planning Studio**, structural reinforcement follows standard IS 456 detailing notation:

```
Beam B1 (BM-01-F0) [Span: 4.20m | Section: 230mm × 450mm]
├── B1-01 → Bottom Main Bar  [16mm Ø Fe500 | 3 Nos | Cut Len: 4.70m | Pos: Bottom Main Bar]
├── B1-02 → Top Main Bar     [16mm Ø Fe500 | 2 Nos | Cut Len: 4.70m | Pos: Top Main Bar]
└── B1-03 → Shear Stirrups   [ 8mm Ø Fe500 | 29 Nos | Spacing: 150mm c/c | Pos: Stirrup Loop]
```

---

## ⚠️ Structural Engineering Disclaimer

> **IMPORTANT NOTICE**:
> All structural grid layouts, column/beam placement, 3D rebar visualizations, quantity takeoffs, and Bar Bending Schedules (BBS) generated by **VastuPlan AI** are intended for preliminary architectural planning, mapping, and visualization purposes.
>
> They **MUST NOT** be used for actual construction without explicit verification, analysis, and certification by a qualified, licensed structural engineer.

---

## 📄 License

This project is developed for educational, research, and technical visualization purposes as part of a Final Year Engineering Project.