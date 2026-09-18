# VASTUCRAFT AI — Cross-Platform Setup Guide (Windows, macOS & Linux)

This guide provides step-by-step setup instructions to clone, install, configure, and run **VASTUCRAFT AI** on any other laptop or PC (Windows, macOS, or Linux).

---

## 💻 1. Operating System Prerequisites

Before starting, install the core developer toolchain on the target laptop:

| OS | Prerequisites | Installation Command / Link |
| :--- | :--- | :--- |
| **Windows 10/11** | Node.js 18+, Python 3.10-3.13, Git, C++ Build Tools | [nodejs.org](https://nodejs.org/), [python.org](https://www.python.org/), [visualstudio.microsoft.com/visual-cpp-build-tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |
| **macOS** | Node.js 18+, Python 3.10-3.13, Homebrew, Xcode CLI | `brew install node python@3.11 git opencv tesseract` |
| **Linux (Ubuntu/Debian)** | Node.js 18+, Python 3.10-3.13, Build-essential, OpenCV libs | `sudo apt update && sudo apt install -y python3-pip python3-venv nodejs npm git libgl1-mesa-glx tesseract-ocr` |

---

## 📥 2. Step-by-Step Setup Process

### Step 2.1: Clone Repository
Open terminal/command prompt on the target laptop:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/VASTUCRAFT-AI.git
cd VASTUCRAFT-AI
```

---

### Step 2.2: Backend Setup (Python + OpenCV + FastAPI)

1. **Navigate to Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create Python Virtual Environment**:
   - **Windows**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Required Python Dependencies**:
   ```bash
   pip install --upgrade pip
   pip install fastapi uvicorn opencv-python numpy pydantic sqlalchemy shapely pillow pytest python-multipart
   ```

4. **Verify OpenCV & Pytest Installation**:
   ```bash
   python -m pytest tests
   ```
   *Expected Output: `14 passed in 0.68s`*

5. **Start FastAPI Backend Server**:
   ```bash
   python -m uvicorn app.main:app --port 8000 --reload
   ```

---

### Step 2.3: Frontend Setup (React + Vite + Three.js + Tailwind CSS)

Open a **second terminal window** on the target laptop:

1. **Navigate to Frontend Directory**:
   ```bash
   cd VASTUCRAFT-AI/frontend
   ```

2. **Install Node.js Package Dependencies**:
   ```bash
   npm install
   ```

3. **Start Vite Frontend Server**:
   ```bash
   npm run dev
   ```

4. **Access Web Application**:
   Open browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 🛠️ 3. Troubleshooting Cross-Platform Setup Issues

### Issue A: OpenCV `ImportError: libGL.so.1` (Linux Laptops)
- **Cause**: Missing OpenGL system libraries required by OpenCV on Linux.
- **Fix**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y libgl1-mesa-glx libglib2.0-0
  ```

### Issue B: C++ Compiler Error installing `Shapely` (Windows Laptops)
- **Cause**: Missing C++ build tools required for binary geometry algorithms.
- **Fix**: Install pre-compiled wheel binaries:
  ```powershell
  pip install --only-binary=:all: shapely
  ```

### Issue C: `Node.js Version Incompatibility`
- **Cause**: Node.js version is below `v18.0.0`.
- **Fix**: Upgrade Node.js via NVM (Node Version Manager):
  ```bash
  nvm install 20
  nvm use 20
  ```

### Issue D: `Permission Denied` when executing bash scripts on macOS/Linux
- **Fix**:
  ```bash
  chmod +x auto_commit.ps1
  ```

---

## ⚡ Quick Sanity Checklist for New PCs

- [x] Backend running on `http://localhost:8000/docs`
- [x] Frontend running on `http://localhost:5173`
- [x] OpenCV image upload & preprocessor test passing
- [x] 3D Three.js building viewport rendering smoothly
- [x] Steel Planning Studio & BBS export functional
