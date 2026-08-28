#!/usr/bin/env python3
"""
Auto Audio — Unified Studio Launcher
====================================
Launches the FastAPI backend which directly serves the Obsidian Sonic Lab
HTML/JS frontend, verifies health, and opens the application in your browser.

Usage:
    python launch.py
    python launch.py --no-browser
    python launch.py --port 8000
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
from typing import Optional

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
    """Verify Python and FFmpeg requirements."""
    if sys.version_info < (3, 9):
        print("⚠️ Warning: Python 3.9+ is recommended.")

    if not shutil.which("ffmpeg"):
        print("⚠️ Warning: 'ffmpeg' not found on PATH. FFmpeg is required for final video rendering.")


def wait_for_service(url: str, timeout_sec: float = 15.0) -> bool:
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
        time.sleep(0.3)
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
    parser = argparse.ArgumentParser(description="Auto Audio Studio Launcher")
    parser.add_argument("--port", type=int, default=8000, help="Preferred server port (default: 8000)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host binding (default: 127.0.0.1)")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically open browser")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print(" 🎬  Auto Audio — AI Sound Design Studio")
    print("=" * 60 + "\n")

    check_prerequisites()

    server_port = find_free_port(args.port, host=args.host)
    if server_port != args.port:
        print(f"ℹ️  Port {args.port} was busy. Assigned port: {server_port}")

    app_url = f"http://{args.host}:{server_port}"
    print(f"🚀 Application URL : {app_url}\n")

    server_proc: Optional[subprocess.Popen] = None

    try:
        print("🚀 Starting Auto Audio server (FastAPI + Studio Workstation)...")
        server_cmd = [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            args.host,
            "--port",
            str(server_port),
            "--reload",
        ]
        server_env = os.environ.copy()
        server_proc = subprocess.Popen(
            server_cmd,
            cwd=str(BACKEND_DIR),
            env=server_env,
        )

        print("⏳ Waiting for health check...")
        if wait_for_service(f"{app_url}/api/health", timeout_sec=12.0):
            print("✅ Auto Audio Studio is ready!")
        else:
            print("⚠️ Server startup took longer than usual, proceeding...")

        print("\n" + "=" * 60)
        print(" 🎉 Auto Audio is LIVE and ready to design sound!")
        print(f" 🌐 Studio Workstation : {app_url}")
        print(f" 🔌 API Documentation : {app_url}/docs")
        print(f" 💚 Health Endpoint    : {app_url}/api/health")
        print("=" * 60)
        print("  Press Ctrl+C at any time to cleanly stop the server.\n")

        if not args.no_browser:
            time.sleep(0.4)
            webbrowser.open(app_url)

        while True:
            time.sleep(1)
            if server_proc.poll() is not None:
                print(f"❌ Server process exited with code {server_proc.returncode}")
                break

    except KeyboardInterrupt:
        print("\n🛑 Shutdown signal received...")
    finally:
        print("🧹 Stopping server...")
        if server_proc and server_proc.poll() is None:
            kill_process_tree(server_proc.pid)
        print("✨ Server stopped cleanly. Goodbye!\n")


if __name__ == "__main__":
    main()
