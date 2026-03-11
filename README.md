# Scriptloom - Write with clarity and insight

A Spirit-Led Writing & Speaking Assistant for Christian content creators.

## Features (MVP Sprint 1)

- ✅ User authentication (Sign up / Sign in)
- ✅ Project creation with role and type selection
- ✅ Minimalist writing editor with auto-save
- ✅ Notes for storing and organizing sermon/church notes
- ✅ Tag-based organization and search

## Tech Stack

- **Frontend:** Next.js 16+ with React 19, TypeScript
- **UI:** TailwindCSS, ShadCN UI
- **Backend:** Supabase (PostgreSQL, Authentication)
- **Forms:** React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Setup Instructions

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key from the project settings

3. **Configure environment variables:**
   - Copy `env.example` to `.env.local`
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Run database migrations:**
   - In your Supabase dashboard, go to SQL Editor
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`
   - This creates the `projects` and `notes` tables with proper RLS policies

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up for a new account or sign in

## Project Structure

```
bonded_by_god/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── projects/       # Project list and creation
│   │   ├── editor/         # Writing interface
│   │   └── notes/          # Notes
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # ShadCN UI components
│   ├── editor/             # Editor components
│   ├── project/            # Project-related components
│   ├── notes/              # Notes components
│   └── auth/                # Auth components
├── lib/
│   ├── supabase/           # Supabase client utilities
│   └── hooks/              # Custom React hooks
├── types/
│   └── database.ts         # TypeScript types
└── supabase/
    └── migrations/         # Database migrations
```

## Database Schema

### Projects Table
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `title` (text)
- `type` (enum: 'book', 'sermon', 'devotional', 'notes')
- `role` (text)
- `content` (text)
- `structure` (jsonb, optional)
- `created_at`, `updated_at` (timestamps)

### Notes Table
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to auth.users)
- `content` (text)
- `tags` (text array)
- `created_at`, `updated_at` (timestamps)

Both tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Next Steps (Future Sprints)

- AI-powered scripture suggestions
- AI writing assistance prompts
- Export functionality (PDF, Word, email)
- Writing goal tracking
- Daily scripture focus
- Advanced sermon outline generator

## License

Private project - All rights reserved
