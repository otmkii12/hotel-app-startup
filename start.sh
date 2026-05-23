#!/bin/bash
# Quick Start Script for Hotel App with Docker

set -e

echo "================================"
echo "Hotel App - Docker Quick Start"
echo "================================"
echo ""

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created with default values"
    echo "   Edit .env to customize database credentials if needed"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🚀 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "mysql"; then
    echo "✅ MySQL is running"
else
    echo "❌ MySQL failed to start. Check logs with: docker-compose logs mysql"
    exit 1
fi

if docker-compose ps | grep -q "phpmyadmin"; then
    echo "✅ PHPMyAdmin is running"
else
    echo "❌ PHPMyAdmin failed to start. Check logs with: docker-compose logs phpmyadmin"
    exit 1
fi

if docker-compose ps | grep -q "php"; then
    echo "✅ PHP/Apache is running"
else
    echo "❌ PHP/Apache failed to start. Check logs with: docker-compose logs php"
    exit 1
fi

echo ""
echo "================================"
echo "✨ All services are running!"
echo "================================"
echo ""
echo "📍 Access Points:"
echo "   Frontend:   http://localhost/public/index.html"
echo "   PHPMyAdmin: http://localhost:8080"
echo "   API Docs:   http://localhost/src/backend/index.php"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs:       docker-compose logs -f"
echo "   Stop services:   docker-compose down"
echo "   Restart:         docker-compose restart"
echo "   Database backup: docker exec hotel-app-mysql mysqldump -u hotel_user -photelpass123 hotel_app_db > backup.sql"
echo ""
echo "📖 See README.md for detailed documentation"
echo ""

