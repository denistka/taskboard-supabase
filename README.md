# Limitless Board - Collaborative Task Planning

Real-time collaborative task management with Vue.js, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Environment variables**
   Create `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Apply migrations**
   Run migrations in your Supabase project from `supabase/migrations/` directory

4. **Run development server**
   ```bash
   pnpm dev
   ```

## 📦 Build & Deploy

```bash
pnpm build        # Build for production
pnpm preview      # Preview production build
```

Deploy to Vercel, Netlify, or any static hosting service.
