import os
import subprocess
import sys
import platform
import shutil

def build_server_binary():
    """
    Bundles the FastAPI server into a single executable using PyInstaller.
    This binary will be used as a 'Sidecar' for Tauri.
    """
    print("🚀 Starting Maia Server Build...")
    
    server_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    dist_dir = os.path.join(server_dir, "dist_bin")
    
    # Target path for Tauri sidecar
    # Tauri expects: binaries/<name>-<target-triple>[.exe]
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    # Map to Rust triples
    if system == "windows":
        triple = "x86_64-pc-windows-msvc"
        ext = ".exe"
    elif system == "darwin":
        triple = "x86_64-apple-darwin" if machine == "x86_64" else "aarch64-apple-darwin"
        ext = ""
    else:
        triple = "x86_64-unknown-linux-gnu"
        ext = ""
        
    binary_name = f"maia-server-{triple}{ext}"
    output_path = os.path.join(os.path.dirname(server_dir), "src-tauri", "binaries")
    
    if not os.path.exists(output_path):
        os.makedirs(output_path)

    # Command to build
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", f"maia-server-{triple}",
        "--additional-hooks-dir", "scripts/hooks",
        "--collect-all", "uvicorn",
        "--collect-all", "fastapi",
        "--hidden-import", "motor",
        "--hidden-import", "chromadb",
        "--hidden-import", "google.generativeai",
        "main.py"
    ]
    
    print(f"📦 Executing: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, cwd=server_dir, check=True)
        
        # Move to tauri binaries folder
        src_bin = os.path.join(server_dir, "dist", binary_name)
        dest_bin = os.path.join(output_path, binary_name)
        
        if os.path.exists(src_bin):
            shutil.copy2(src_bin, dest_bin)
            print(f"✅ Binary created and moved to: {dest_bin}")
        else:
            print(f"⚠️ Binary not found at {src_bin}. Build might have failed.")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during build: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Ensure pyinstaller is installed
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
        
    build_server_binary()
