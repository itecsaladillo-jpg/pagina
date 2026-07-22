#!/bin/bash
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi
# pip install -r requirements.txt
echo "=========================================="
echo "Iniciando servidor backend del Asistente ITEC..."
echo "=========================================="
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
