#!/bin/bash
# Stop Script for Hotel App Docker Services

set -e

echo "================================"
echo "Stopping Hotel App Services"
echo "================================"
echo ""

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "🛑 Stopping Docker services..."
docker-compose down

echo ""
echo "✅ All services have been stopped"
echo ""
echo "💾 Note: Database data is still preserved"
echo ""
echo "To remove all data (nuclear option):"
echo "  docker-compose down -v"
echo ""

