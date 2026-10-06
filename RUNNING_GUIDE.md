# VASTUCRAFT AI — How to Run Frontend & Backend (Complete Step-by-Step Guide)

This guide provides exact step-by-step instructions to run the **VASTUCRAFT AI** application (FastAPI Python OpenCV Backend + React Vite Three.js Frontend) on your local machine.

---

## 📋 System Prerequisites

Ensure the following tools are installed on your system:
- **Node.js**: `v18.0.0` or higher ([nodejs.org](https://nodejs.org/))
- **Python**: `v3.10` to `v3.13` ([python.org](https://www.python.org/))
- **Git**: ([git-scm.com](https://git-scm.com/))

Check installed versions in your terminal:
```bash
node -v
npm -v
python --version
git --version
```

---

## 🐍 1. Setting Up & Running the Backend (FastAPI + OpenCV)

### Step 1.1: Open Terminal & Navigate to Backend
```bash
cd "d:/Sem study/Final Year Project/Project/backend"
```

### Step 1.2: Create & Activate Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 1.3: Install Python Dependencies
```bash
pip install --upgrade pip
pip install fastapi uvicorn opencv-python numpy pydantic sqlalchemy shapely pillow pytest python-multipart
```

### Step 1.4: Run Pytest Test Suite (Verification)
```bash
python -m pytest tests
```
*Expected Output: All 14 unit test suites pass cleanly in ~0.7s.*

### Step 1.5: Launch FastAPI Development Server
```bash
python -m uvicorn app.main:app --port 8000 --reload
```

> [!IMPORTANT]
> If you see `ERROR: [WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions`, port 8000 is ALREADY in use by another active server process!
>
> **Option A (Quickest)**: Launch server on port 8001:
> ```bash
> python -m uvicorn app.main:app --port 8001 --reload
> ```
>
> **Option B**: Free port 8000 by killing the active process in PowerShell:
> ```powershell
> # 1. Find PID using port 8000
> Get-NetTCPConnection -LocalPort 8000 | Select-Object LocalAddress, LocalPort, OwningProcess
>
> # 2. Kill the PID (replace <PID> with number, e.g. 20436)
> Stop-Process -Id <PID> -Force
> ```

Expected Terminal Output:
```
INFO:     Started server process [27344]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

- **Interactive API Documentation (Swagger UI)**: Access at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ⚛️ 2. Setting Up & Running the Frontend (React + Vite + Tailwind + Three.js)

Open a **new terminal window** while leaving the backend server running.

### Step 2.1: Open Terminal & Navigate to Frontend
```bash
cd "d:/Sem study/Final Year Project/Project/frontend"
```

### Step 2.2: Install Node Modules
```bash
npm install
```

### Step 2.3: Launch Vite Frontend Dev Server
```bash
npm run dev
```

In development, Vite proxies `/api/v1` requests to the backend at `http://127.0.0.1:8000`. Start the backend first; if it is unavailable, plan generation reports the API error instead of showing a fixed fallback layout.

Expected Terminal Output:
```
  VITE v8.2.1  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Step 2.4: Open Web Application in Browser
Open your browser and navigate to:
**[http://localhost:5173](http://localhost:5173)**

---

## 🏗️ 3. Production Build Verification (Optional)

To build the production bundle for deployment:

```bash
cd "d:/Sem study/Final Year Project/Project/frontend"
npm run build
```

The compiled assets will be output in `frontend/dist/`.

---

## 🛟 Troubleshooting Common Running & Port Issues

### Issue 1: `[WinError 10013]` / `[Errno 10048]` (Port 8000 Occupied)
If running `uvicorn` gives:
`ERROR: [WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions` or `[Errno 10048] address already in use`.

**Cause**: Port 8000 is already occupied by a background Python uvicorn server or process.

**Solutions**:
1. **Find & Kill Process Holding Port 8000 (Windows PowerShell)**:
   ```powershell
   # 1. Get process ID (PID) holding port 8000
   Get-NetTCPConnection -LocalPort 8000 | Select-Object LocalAddress, LocalPort, OwningProcess

   # 2. Kill specific PID (replace <PID> with the process ID number e.g. 20436)
   Stop-Process -Id <PID> -Force
   ```
2. **Or Run Backend on an Alternative Port (e.g. 8001)**:
   ```bash
   python -m uvicorn app.main:app --port 8001 --reload
   ```

---

### Issue Summary Table

| Issue / Error | Cause | Solution |
| :--- | :--- | :--- |
| `[WinError 10013]` / `[Errno 10048]` | Port 8000 is already occupied | Stop PID via `Stop-Process -Id <PID> -Force` or run on `--port 8001`. |
| `ModuleNotFoundError: No module named 'cv2'` | OpenCV not installed in venv | Run `pip install opencv-python numpy` in active virtualenv. |
| `TypeError: cannot unpack non-iterable numpy.int32` | OpenCV `findContours`/`HoughLinesP` structure | Fixed in codebase. Run `python -m pytest tests` to verify. |
| `vite command not found` | Node packages not installed | Run `npm install` inside `frontend/` directory. |
| `CORS Error in Browser Console` | Backend server not running | Ensure FastAPI server is active on `http://localhost:8000`. |
