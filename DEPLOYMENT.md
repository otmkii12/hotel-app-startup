# Deployment Guide

This guide explains how to deploy the Hotel App to production environments.

## Project Architecture

The Hotel App runs on a **hybrid backend architecture**:

- **Frontend**: Hosted on Firebase Hosting (static files: HTML, CSS, JS)
- **Backend API**: Runs on PHP/Apache with MySQL database
- **Authentication**: Firebase Authentication (client-side)
- **Database**: MySQL (can be self-hosted or cloud-hosted)

## Deployment Options

### Option 1: Firebase Hosting + Self-Hosted PHP Backend (Recommended for Learning)

#### Frontend Deployment (Firebase)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy frontend to Firebase Hosting
firebase deploy --only hosting
```

**Note**: Configure `firebase.json` to deploy only the `/public` folder:
```json
{
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "*.md",
      ".gitignore",
      "src/**",
      "database/**",
      "docker/**"
    ]
  }
}
```

#### Backend Deployment (Self-Hosted Server)
1. Rent a VPS (DigitalOcean, Linode, AWS EC2, etc.)
2. Install PHP 8.1+ and MySQL 8.0+
3. Upload `/src/backend` folder to web server (e.g., `/var/www/hotel-api`)
4. Update `.env` with production database credentials
5. Set up HTTPS with Let's Encrypt
6. Configure PHP security settings

### Option 2: Heroku + Firebase (Easy but Limited Free Tier)

#### Deploy Backend to Heroku
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create Heroku app
heroku create hotel-app-api

# Add MySQL add-on
heroku addons:create cleardb:ignite

# Set environment variables
heroku config:set MYSQL_HOST=... MYSQL_USER=... MYSQL_PASSWORD=...

# Deploy
git push heroku main
```

### Option 3: Docker Cloud Deployment (AWS, Google Cloud, Heroku)

#### Deploy with Docker to AWS ECS / Google Cloud Run
```bash
# Build Docker image
docker build -t hotel-app:latest .

# Push to Docker Hub or Cloud Registry
docker tag hotel-app:latest yourusername/hotel-app:latest
docker push yourusername/hotel-app:latest

# Deploy using cloud platform's CLI
# AWS ECS, Google Cloud Run, etc.
```

## Production Configuration

### 1. Environment Variables (.env for production)

Store securely in cloud provider's secret management:

```env
# Database (Use cloud database or managed service)
MYSQL_HOST=production-mysql.example.com
MYSQL_DATABASE=hotel_app_prod
MYSQL_USER=secret_user
MYSQL_PASSWORD=very_secure_password_32_chars_long
MYSQL_PORT=3306

# CORS (restrict to your domain)
ALLOWED_ORIGINS=https://hotel-app.com,https://admin.hotel-app.com

# API Settings
API_BASE_URL=https://api.hotel-app.com
ENV=production
```

### 2. Database Security

- **Never** commit `.env` with real credentials
- Use cloud-managed databases (AWS RDS, Google Cloud SQL, Azure Database)
- Enable SSL/TLS for database connections
- Set up regular automated backups
- Restrict database access by IP whitelist

### 3. HTTPS/SSL Certificate

Enable HTTPS on your API:

```bash
# Using Let's Encrypt (free)
sudo certbot certonly --webroot -w /var/www/hotel-api -d api.hotel-app.com
```

### 4. CORS Configuration

Update PHP API to allow only your frontend domain:

```php
// In src/backend/api/*.php
header('Access-Control-Allow-Origin: https://hotel-app.com');
header('Access-Control-Allow-Credentials: true');
```

### 5. API Rate Limiting

Implement rate limiting to prevent abuse:

```php
// Add to src/backend/config/rate-limit.php
function checkRateLimit($ip, $limit = 100, $window = 3600) {
    // Implementation using Redis or database
}
```

### 6. Security Headers

Add security headers in Apache config:

```apache
# In docker/apache.conf
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "DENY"
Header set X-XSS-Protection "1; mode=block"
Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
```

## CI/CD Pipeline Example (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Hotel App

on:
  push:
    branches: [main, production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy Frontend to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
      
      - name: Deploy Backend
        run: |
          # SSH into production server
          ssh -i ${{ secrets.SSH_KEY }} user@api.hotel-app.com 'cd /var/www/hotel-api && git pull origin main && php composer.phar install'
```

## Database Migration

Migrate from Firebase Firestore to MySQL:

```bash
# Export Firestore data
firebase firestore:export ./firestore-backup

# Import into MySQL using custom script
php scripts/migrate-firestore-to-mysql.php

# Verify migration
# Check record counts match
```

## Monitoring

Set up monitoring for production:

1. **Error Tracking**: Sentry, Rollbar, or CloudWatch
2. **Performance Monitoring**: New Relic, DataDog
3. **Log Aggregation**: ELK Stack, CloudWatch, Stackdriver
4. **Uptime Monitoring**: StatusPage, PingDom

Example: Add error logging to PHP:

```php
// In src/backend/config/db.php
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    // Optionally send to Sentry
    logToSentry("Database connection failed");
}
```

## Scalability Considerations

As your app grows:

1. **Database**: Use read replicas, implement caching (Redis)
2. **API**: Use API Gateway, implement load balancing
3. **Frontend**: Use CDN for static assets (CloudFront, Cloudflare)
4. **Sessions**: Use managed session storage (Redis, Memcached)

## Troubleshooting Production Issues

### API not responding
- Check server logs: `tail -f /var/log/apache2/error.log`
- Verify database connection: `mysql -h $HOST -u $USER -p`
- Check firewall rules

### Database connection timeout
- Increase connection timeout in `db.php`
- Check database server status
- Verify network connectivity

### High latency
- Enable database query caching
- Implement API response caching
- Use CDN for static files

## Rollback Procedure

If production deployment fails:

```bash
# Firebase rollback
firebase hosting:channels:deploy (previous-version)

# Backend rollback
git revert <commit-hash>
git push production
```

## Backup Strategy

Automated daily backups:

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h $HOST -u $USER -p$PASS $DB > /backups/hotel_app_$DATE.sql
# Upload to S3 or Cloud Storage
```

## Cost Estimation (Monthly)

- **Firebase Hosting**: ~$0-10 (free tier covers most cases)
- **Firebase Authentication**: ~$0-7 per 100K sign-ins
- **VPS for PHP/MySQL**: $5-50 (DigitalOcean, Linode)
- **MySQL Cloud Service** (optional): $15-100 (AWS RDS, Google Cloud SQL)
- **CDN**: ~$0.085 per GB (Cloudflare, CloudFront)
- **Domain**: ~$10-15/year

**Total**: $20-100/month depending on traffic

## Next Steps

1. Choose hosting provider based on budget and scale
2. Set up CI/CD pipeline for automated deployments
3. Configure monitoring and alerting
4. Create backup and rollback procedures
5. Document deployment process for team
6. Test disaster recovery scenario

## Support

For deployment issues:
- Check Firebase Console: https://console.firebase.google.com
- Review server logs and error tracking
- Check cloud provider documentation
- Ask in development team chat

---

**Last Updated**: May 2026
**Status**: Production Ready ✅

