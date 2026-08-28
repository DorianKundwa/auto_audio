#!/usr/bin/env python3
"""
Auto Audio — Unified Development Launcher
==========================================
Automatically finds open ports for both the FastAPI backend and Next.js frontend,
configures environment routing, launches both services concurrently, and opens
the application in your browser.

Usage:
    python launch.py
    python launch.py --no-browser
    python launch.py --backend-port 8000 --frontend-port 3000
"""

import os
import sys
import time
import socket
import signal
import shutil
import urllib.request
import webbrowser
import argparse
import subprocess
from pathlib import Path
from typing import Optional, Tuple

ROOT_DIR = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"


def is_port_free(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a TCP port is free for binding."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind((host, port))
            return True
        except OSError:
            return False


def find_free_port(start_port: int, max_attempts: int = 100, host: str = "127.0.0.1") -> int:
    """Search for the first available TCP port starting at start_port."""
    for port in range(start_port, start_port + max_attempts):
        if is_port_free(port, host):
            return port
    raise RuntimeError(f"Could not find an available port in range {start_port}-{start_port + max_attempts}")


def check_prerequisites():
    """Verify Node, npm, and Python requirements."""
    # Check Python version
    if sys.version_info < (3, 9):
        print("⚠️ Warning: Python 3.9+ is recommended.")

    # Check for npm
    npm_cmd = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm_cmd:
        print("❌ Error: 'npm' was not found on PATH. Please install Node.js (https://nodejs.org/).")
        sys.exit(1)

    # Check for frontend node_modules
    if not (FRONTEND_DIR / "node_modules").exists():
        print("📦 Installing frontend dependencies (node_modules not found)...")
        res = subprocess.run([npm_cmd, "install"], cwd=str(FRONTEND_DIR), shell=(os.name == "nt"))
        if res.returncode != 0:
            print("❌ Error: 'npm install' failed.")
            sys.exit(1)

    # Check for ffmpeg
    if not shutil.which("ffmpeg"):
        print("⚠️ Warning: 'ffmpeg' not found on PATH. FFmpeg is required for video rendering.")


def wait_for_service(url: str, timeout_sec: float = 20.0) -> bool:
    """Poll a URL until it returns 200 OK or times out."""
    start_time = time.time()
    while time.time() - start_time < timeout_sec:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AutoAudio-Launcher"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(0.4)
    return False


def kill_process_tree(pid: int):
    """Terminate a process and all its children cleanly."""
    if os.name == "nt":
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True)
    else:
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except Exception:
            try:
                os.kill(pid, signal.SIGTERM)
            except Exception:
                pass


def main():
    parser = argparse.ArgumentParser(description="Auto Audio Fullstack Launcher")
    parser.add_argument("--backend-port", type=int, default=8000, help="Preferred backend port (default: 8000)")
    parser.add_argument("--frontend-port", type=int, default=3000, help="Preferred frontend port (default: 3000)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host binding (default: 127.0.0.1)")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically open browser")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print(" 🎬  Auto Audio — AI Sound Design Studio Launcher")
    print("=" * 60 + "\n")

    # Step 1: Prerequisites
    check_prerequisites()

    # Step 2: Port allocation
    backend_port = find_free_port(args.backend_port, host=args.host)
    if backend_port != args.backend_port:
        print(f"ℹ️  Backend port {args.backend_port} was busy. Assigned port: {backend_port}")

    # Ensure frontend port does not collide with backend port
    start_frontend_port = args.frontend_port
    if start_frontend_port == backend_port:
        start_frontend_port += 1
    frontend_port = find_free_port(start_frontend_port, host=args.host)
    if frontend_port != args.frontend_port:
        print(f"ℹ️  Frontend port {args.frontend_port} was busy. Assigned port: {frontend_port}")

    backend_url = f"http://{args.host}:{backend_port}"
    frontend_url = f"http://{args.host}:{frontend_port}"

    print(f"\n🔌 Backend target  : {backend_url}")
    print(f"🌐 Frontend target : {frontend_url}\n")

    backend_proc: Optional[subprocess.Popen] = None
    frontend_proc: Optional[subprocess.Popen] = None

    try:
        # Step 3: Launch FastAPI Backend
        print("🚀 Starting FastAPI backend (Uvicorn)...")
        backend_cmd = [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            args.host,
            "--port",
            str(backend_port),
            "--reload",
        ]
        backend_env = os.environ.copy()
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(BACKEND_DIR),
            env=backend_env,
        )

        # Wait for backend health
        print("⏳ Waiting for backend health check...")
        if wait_for_service(f"{backend_url}/api/health", timeout_sec=15.0):
            print("✅ Backend API is ready!")
        else:
            print("⚠️ Backend taking longer to start, proceeding to frontend...")

        # Step 4: Launch Next.js Frontend
        print("🚀 Starting Next.js frontend...")
        npm_cmd = shutil.which("npm") or shutil.which("npm.cmd")
        frontend_cmd = [npm_cmd, "run", "dev", "--", "-p", str(frontend_port)]
        
        frontend_env = os.environ.copy()
        frontend_env["BACKEND_URL"] = backend_url
        frontend_env["PORT"] = str(frontend_port)

        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=str(FRONTEND_DIR),
            env=frontend_env,
            shell=(os.name == "nt"),
        )

        # Wait for frontend ready
        print("⏳ Waiting for frontend server...")
        if wait_for_service(frontend_url, timeout_sec=25.0):
            print("✅ Frontend is ready!")

        # Print banner
        print("\n" + "=" * 60)
        print(" 🎉 Auto Audio is LIVE and ready to design sound!")
        print(f" 🌐 Application : {frontend_url}")
        print(f" 🔌 API Docs    : {backend_url}/docs")
        print(f" 💚 Health Check: {backend_url}/api/health")
        print("=" * 60)
        print("  Press Ctrl+C at any time to cleanly stop both servers.\n")

        # Open browser
        if not args.no_browser:
            time.sleep(0.5)
            webbrowser.open(frontend_url)

        # Keep launcher running and supervise subprocesses
        while True:
            time.sleep(1)
            # If any process terminated prematurely, exit loop
            if backend_proc.poll() is not None:
                print(f"❌ Backend process exited with code {backend_proc.returncode}")
                break
            if frontend_proc.poll() is not None:
                print(f"❌ Frontend process exited with code {frontend_proc.returncode}")
                break

    except KeyboardInterrupt:
        print("\n🛑 Shutdown signal received...")
    finally:
        print("🧹 Terminating backend and frontend processes...")
        if backend_proc and backend_proc.poll() is None:
            kill_process_tree(backend_proc.pid)
        if frontend_proc and frontend_proc.poll() is None:
            kill_process_tree(frontend_proc.pid)
        print("✨ All services stopped cleanly. Goodbye!\n")


if __name__ == "__main__":
    main()
