#!/bin/bash

echo "🚀 DeliverTrack Setup Script"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please create .env file with your MongoDB connection string"
    echo "   See .env.example for template"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Generate Prisma client
echo "📦 Generating Prisma client..."
npm run db:generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi
echo "✅ Prisma client generated"
echo ""

# Push schema to database
echo "🗄️  Pushing schema to MongoDB..."
npm run db:push
if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema"
    echo "   Check your DATABASE_URL in .env"
    exit 1
fi
echo "✅ Schema pushed successfully"
echo ""

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi
echo "✅ Database seeded with 10 records + admin user"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Place your logo.png in the /public folder"
echo "   2. Run: npm run dev"
echo "   3. Visit: http://localhost:3000"
echo ""
echo "🔐 Admin credentials:"
echo "   Email: admin@delivertrack.com"
echo "   Password: admin123"
echo ""
echo "⚠️  Remember to change the admin password in production!"
