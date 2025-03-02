</thinking>

# MyPromptHub

MyPromptHub is a modern web application for browsing, customizing, saving, and organizing research prompts. It allows you to manage prompt templates, customize variables, organize prompts into folders, and sync your data with GitHub.


## 🌟 Features

- **Browse Prompt Templates**: Explore a collection of research prompts organized by categories and tags
- **Customize Variables**: Fill in template variables to generate customized prompts
- **Save and Organize**: Store your favorite prompts and organize them into folders
- **Create Custom Templates**: Design your own templates with variable placeholders
- **GitHub Sync**: Back up and synchronize your prompts using GitHub Gists
- **Rating System**: Rate prompts to help identify the most useful ones
- **Supabase Integration**: Cloud storage for prompts and translations
- **Internationalization**: Support for multiple languages (currently English and Portuguese)
- **Privacy-Focused Analytics**: Opt-in analytics with transparency controls

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: GitHub OAuth for Gist synchronization
- **Storage**: Local Storage (fallback) + Supabase Cloud Storage
- **Internationalization**: i18next
- **Build Tool**: Vite
- **Deployment**: PWA-ready

## 📋 Prerequisites

- Node.js 16+
- npm or yarn
- [Supabase](https://supabase.io) account (optional but recommended)
- [GitHub](https://github.com) account (optional, for Gist sync)

## 🚀 Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/myprompt-hub.git
   cd myprompt-hub
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables by creating a `.env` file in the root directory
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🗄️ Database Setup

MyPromptHub can work entirely with local storage, but for better persistence and sharing capabilities, we recommend setting up Supabase.

### Setting Up Supabase

1. Create a new project on [Supabase](https://supabase.io)
2. Copy your project URL and anon/public key to the `.env` file
3. Run the database setup script to create the required tables and policies
   ```bash
   npm run setup-db
   # or
   yarn setup-db
   ```
4. Seed the database with initial prompts
   ```bash
   npm run seed
   # or
   yarn seed
   ```

### Database Schema

The application uses three main tables:

- **prompts**: Stores basic prompt metadata (categories, tags, ratings)
- **prompt_translations**: Contains translatable content (title, description, prompt text)
- **prompt_ratings**: Tracks user ratings for prompts

## 📝 Usage

### Browsing Prompts

Navigate to the "Browse" section to explore available prompts. Use the search bar and filters to find specific prompts by category or tags.

### Customizing and Saving Prompts

1. Click on a prompt to view its details
2. Fill in any variables to customize the prompt
3. Click "Save" to store the customized prompt
4. Optionally, add tags and select a folder to organize your saved prompts

### Creating Custom Templates

1. Click "Create Template" in the browse page
2. Fill in the template details and content
3. Use `{variable_name}` syntax to define customizable variables
4. Add variable definitions with descriptions and types
5. Save your custom template

### Syncing with GitHub

1. Go to the Settings page
2. Click "Login with GitHub" and enter your Personal Access Token
3. Use "Export to Gist" to upload your prompts to GitHub
4. Use "Import from Gist" to restore your prompts from GitHub

## 📁 Project Structure

```
myprompt-hub/
├── .bolt/            # Bolt configuration
├── public/           # Static assets
├── scripts/          # Database and utility scripts
├── src/              # Source code
│   ├── components/   # Reusable UI components
│   ├── contexts/     # React contexts
│   ├── i18n/         # Internationalization
│   │   └── locales/  # Translation files
│   ├── pages/        # Application pages
│   ├── services/     # API and utility services
│   └── types/        # TypeScript type definitions
├── supabase/         # Supabase migrations
│   └── migrations/   # Database migration files
└── .env.example      # Example environment variables
```

## 🔧 Configuration

### Analytics

MyPromptHub offers optional analytics tracking to help improve the user experience. You can enable or disable this in the Settings > Analytics page.

### Internationalization

The application supports multiple languages. Currently available:
- English (en)
- Portuguese (pt-BR)

You can change the language in the settings or by navigating to `/{language-code}/` in the URL.

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run setup-db` - Set up Supabase database tables and policies
- `npm run seed` - Seed database with initial prompts
- `npm run fix-rls` - Fix Row Level Security policies on Supabase

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎨 Customization

### Analytics Configuration

To configure analytics, update the measurement IDs in `src/services/analyticsService.ts`:

```typescript
const MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Google Analytics
const CLARITY_PROJECT_ID = 'xxxxxxxx'; // Microsoft Clarity
```

### Theme and Styling

The project uses Tailwind CSS for styling. You can customize the theme in `tailwind.config.js`.

## 🔍 Troubleshooting

### Supabase Connection Issues

If you encounter issues connecting to Supabase:

1. Check your `.env` file for correct credentials
2. Ensure your Supabase project is active
3. Run `npm run setup-db` to create the required database tables
4. Verify your database has the correct RLS policies with `npm run fix-rls`

### GitHub Synchronization

If GitHub synchronization is not working:

1. Make sure you've created a Personal Access Token with the `gist` scope
2. Check your browser console for any error messages
3. Verify you're properly logged in to GitHub in the app settings

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Supabase Documentation](https://supabase.io/docs)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## ✨ Acknowledgements

- [Lucide Icons](https://lucide.dev/) for the beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for the fast development experience
- [Supabase](https://supabase.io/) for the powerful backend-as-a-service

## 🔒 Security Considerations

- GitHub personal access tokens are stored in localStorage - consider implementing a more secure storage method in production
- Supabase RLS policies are intentionally permissive for easy development - restrict them appropriately for production use
- Consider implementing proper user authentication for a more secure experience

## 🧪 Testing

Currently, the project doesn't include automated tests. For production use, consider adding:

- Unit tests for services and utilities using Jest
- Component tests using React Testing Library
- End-to-end tests using Cypress or Playwright

## 🚀 Deployment

MyPromptHub is PWA-ready and can be deployed to various platforms:

- Vercel: Recommended for easy deployment and environment variable management
- Netlify: Good alternative with similar capabilities
- GitHub Pages: Suitable for static deployments without backend requirements

Simply build the project with `npm run build` and deploy the `dist` directory to your preferred hosting provider.

---

Made with ❤️ by the MyPromptHub Team
