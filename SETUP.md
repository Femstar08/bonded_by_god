# Setup Guide for Scriptloom

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be fully provisioned (takes 1-2 minutes)

3. **Get your Supabase credentials:**
   - In your Supabase project dashboard, go to Settings → API
   - Copy the "Project URL" and "anon public" key

4. **Create environment file:**
   - Copy `env.example` to `.env.local` in the root directory
   - Replace the placeholder values with your actual Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
     ```

5. **Run database migrations:**
   - In Supabase dashboard, go to SQL Editor
   - Click "New query"
   - Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Click "Run" to execute the migration
   - This creates the `projects` and `notes` tables with proper security policies

6. **Start the development server:**
   ```bash
   npm run dev
   ```

7. **Open the app:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to the login page
   - Click "Sign up" to create your first account

## Testing the App

1. **Create a project:**
   - After signing in, click "Create New Project"
   - Fill in the form (title, type, role)
   - Optionally add a structure (chapter titles, etc.)
   - Click "Create Project"

2. **Write in the editor:**
   - Your project will open in the writing editor
   - Start typing - content auto-saves every 2 seconds
   - Watch the word count and save status

3. **Add notes:**
   - Navigate to "Notes" in the sidebar
   - Click "Add New Note"
   - Paste your sermon/church notes
   - Add tags (comma-separated)
   - Save and search/filter by tags

## Troubleshooting

### "Error fetching projects" or similar database errors
- Make sure you've run the database migration in Supabase
- Check that your `.env.local` file has the correct credentials
- Verify your Supabase project is active

### Authentication not working
- Check that Supabase Auth is enabled in your project
- Verify the environment variables are set correctly
- Clear your browser cookies and try again

### Build errors
- Make sure all dependencies are installed: `npm install`
- Check that you're using Node.js 18 or higher
- Try deleting `node_modules` and `.next` folders, then run `npm install` again

## Next Steps

Once the MVP is working, you can:
- Add AI features (scripture suggestions, writing prompts)
- Implement export functionality
- Add writing goal tracking
- Enhance the editor with more features
