# DeliverTrack - Delivery Management System

Modern delivery data entry and management system built with Next.js, Prisma, MongoDB, and NextAuth.

## Features

- 📝 Single & bulk entry forms for delivery records
- 🔐 Secure admin authentication with NextAuth
- 📊 Interactive dashboard with charts and analytics
- 🔍 Advanced filtering and search
- 📤 Export to Excel and ZIP
- 🗄️ MongoDB database with Prisma ORM
- 🎨 Modern UI with Tailwind CSS and shadcn/ui

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update the `.env` file with your MongoDB connection string:

```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/delivertrack?retryWrites=true&w=majority"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Push Database Schema

```bash
npm run db:push
```

### 5. Seed Database with Sample Data

This will create:
- 1 admin user (email: `admin@delivertrack.com`, password: `admin123`)
- 10 sample delivery records

```bash
npm run db:seed
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Public Form
- Visit `/` to access the delivery entry form
- Choose between single or bulk entry mode
- Fill in customer and delivery details
- Submit records to the database

### Admin Dashboard
- Visit `/admin` (requires authentication)
- Login with: `admin@delivertrack.com` / `admin123`
- View all records with filtering and sorting
- Export data to Excel or ZIP
- View analytics charts
- Delete records

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth API routes
│   │   └── records/             # CRUD API for records
│   ├── admin/                   # Admin dashboard
│   ├── login/                   # Login page
│   └── page.tsx                 # Public form
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── navbar.tsx               # Navigation
├── lib/
│   ├── prisma.ts                # Prisma client
│   ├── storage.ts               # API wrapper functions
│   └── types.ts                 # TypeScript types
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed script
└── middleware.ts                # NextAuth middleware
```

## Database Schema

### CustomerRecord
- Customer information (name, phone, country, city)
- Address details (area, street, building, flat)
- Product and COD amount
- Sale agent and group
- Timestamps

### User
- Email and hashed password
- Used for admin authentication

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with sample data

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Database**: MongoDB with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Export**: xlsx + jszip

## License

MIT
