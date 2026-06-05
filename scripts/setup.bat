@echo off
echo.
echo 🚀 DeliverTrack Setup Script
echo ==============================
echo.

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found!
    echo 📝 Please create .env file with your MongoDB connection string
    echo    See .env.example for template
    pause
    exit /b 1
)

echo ✅ .env file found
echo.

REM Generate Prisma client
echo 📦 Generating Prisma client...
call npm run db:generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✅ Prisma client generated
echo.

REM Push schema to database
echo 🗄️  Pushing schema to MongoDB...
call npm run db:push
if errorlevel 1 (
    echo ❌ Failed to push schema
    echo    Check your DATABASE_URL in .env
    pause
    exit /b 1
)
echo ✅ Schema pushed successfully
echo.

REM Seed database
echo 🌱 Seeding database with sample data...
call npm run db:seed
if errorlevel 1 (
    echo ❌ Failed to seed database
    pause
    exit /b 1
)
echo ✅ Database seeded with 10 records + admin user
echo.

echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo    1. Place your logo.png in the /public folder
echo    2. Run: npm run dev
echo    3. Visit: http://localhost:3000
echo.
echo 🔐 Admin credentials:
echo    Email: admin@delivertrack.com
echo    Password: admin123
echo.
echo ⚠️  Remember to change the admin password in production!
echo.
pause
