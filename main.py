"""MedLens AI — Project entry point. Delegates to agent/main.py."""
import subprocess
import sys

if __name__ == "__main__":
    subprocess.run([sys.executable, "agent/main.py"] + sys.argv[1:])
