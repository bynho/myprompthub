# Supabase Setup Guide for MyPromptHub

This document provides step-by-step instructions for setting up Supabase for the MyPromptHub application.

## Prerequisites

- A Supabase account
- A Supabase project

## Setup Steps

### 1. Create a Supabase Project

1. Go to [app.supabase.io](https://app.supabase.io/) and log in
2. Click "New Project"
3. Enter a name for your project
4. Choose a database password (save this somewhere secure)
5. Choose your region
6. Click "Create new project"

### 2. Get Your API Keys

1. Once your project is created, go to the project dashboard
2. In the left sidebar, click on "Settings" > "API"
3. Copy the "URL" and "anon/public" key

### 3. Add Your API Keys to MyPromptHub

1. In your MyPromptHub project, create a `.env` file in the root directory
2. Add the following lines to the `.env` file:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Replace `your-supabase-url` and `your-supabase-anon-key` with the values you copied from the Supabase dashboard

### 4. Set Up the Database Schema

1. In your Supabase dashboard, click on "SQL Editor"
2. Click "New Query"
3. Copy the contents of the `supabase/setup.sql` file from the MyPromptHub project
4. Paste the SQL into the editor
5. Click "Run" to execute the SQL

### 5. Seed the Database

Now that your database schema is set up, you can seed it with initial data:

```bash
npm run seed
```

This will populate your database with the initial prompts from the `src/data/prompts-engb.json` file.

## Troubleshooting

### RLS Policies

If you encounter permission errors when trying to access the database, it might be due to Row Level Security (RLS) policies. To fix this:

1. Make sure all the RLS policies were created correctly in the database setup step
2. If needed, run the RLS fix script:
   ```bash
   npm run fix-rls
   ```

### Connection Issues

If you're having trouble connecting to your Supabase database:

1. Check that your environment variables are set correctly
2. Make sure your Supabase project is active
3. Verify that your IP address is not blocked by Supabase

### Database Setup Script Errors

If you encounter errors when running the database setup script:

1. Try running the SQL manually using the Supabase SQL Editor
2. Check for any error messages in the SQL Editor output
3. If needed, modify the SQL to fix any issues

## Production Considerations

For a production environment, you should:

1. Create a more restrictive set of RLS policies
2. Set up proper authentication for your users
3. Consider using a dedicated service role for database operations
4. Regularly back up your database

## Next Steps

Once your Supabase setup is complete, you can:

1. Create custom prompt templates
2. Save and organize prompts
3. Export your prompts to GitHub Gists
4. Check the database for stored prompts and ratings

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase JavaScript Client](https://supabase.io/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
