#!/bin/bash
# ─── PortfolioCraft Backend Setup Script ───────────────────────────────────────
# Run this inside the backend/ directory on Linux

set -e

echo ">>> Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo ">>> Installing dependencies..."
pip install -r requirements.txt

echo ">>> Copying .env file..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  .env created from example. Edit it to set SECRET_KEY and other settings."
fi

echo ">>> Running migrations..."
python manage.py migrate

echo ">>> Seeding demo data (admin / admin123)..."
python manage.py seed_data --username admin --password admin123

echo ""
echo "✅ Setup complete!"
echo "   Start server: source venv/bin/activate && python manage.py runserver"
echo "   Admin panel:  http://localhost:5173/admin  (login: admin / admin123)"
echo "   Portfolio:    http://localhost:5173/portfolio"
