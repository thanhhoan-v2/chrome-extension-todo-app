# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 15.5 web application bootstrapped with `create-next-app`, built with React 19, TypeScript, and Tailwind CSS 4. This is a fresh project scaffold intended to be developed into a todo application with browser extension capabilities.

## Development Commands

### Development Server
```bash
npm run dev
```
Starts the Next.js development server with Turbopack (fast refresh enabled). Access at `http://localhost:3000`. Changes to `app/page.tsx` and other files will hot-reload automatically.

### Production Build
```bash
npm run build
```
Creates optimized production build with Turbopack bundler.

### Production Server
```bash
npm start
```
Serves the production build (must run `npm run build` first).

## Architecture & Structure

### App Router (Next.js 15)
- **App Directory Pattern**: Uses Next.js App Router (`app/` directory), not Pages Router
- **Server Components by Default**: All components are React Server Components unless marked with `"use client"`
- **File-based Routing**: Routes defined by folder structure in `app/`
  - `app/layout.tsx` - Root layout with font configuration and metadata
  - `app/page.tsx` - Homepage route (`/`)
  - `app/globals.css` - Global styles with Tailwind imports

### Styling System
- **Tailwind CSS 4**: Uses new `@import "tailwindcss"` syntax in `globals.css`
- **Theme Inline**: Custom theme variables defined with `@theme inline` directive
- **CSS Variables**: Design tokens in `:root` for `--background`, `--foreground`
- **Dark Mode**: Automatic dark mode via `prefers-color-scheme` media query
- **Geist Fonts**: Custom font configuration (Geist Sans & Geist Mono) loaded via `next/font/google`

### TypeScript Configuration
- **Path Aliases**: `@/*` maps to project root (e.g., `@/app/page.tsx`)
- **Strict Mode**: TypeScript strict checking enabled
- **Module Resolution**: Uses `bundler` strategy (Next.js optimized)
- **Target**: ES2017 compilation target

### Turbopack Build System
- **Default Bundler**: Both dev and build use `--turbopack` flag
- **Fast Refresh**: Near-instant updates during development
- **No Webpack**: Turbopack replaces webpack entirely

## Development Guidelines

### Component Patterns
- Start all client components with `"use client"` directive
- Server components should not use hooks, event handlers, or browser APIs
- Use async/await in Server Components for data fetching
- Leverage Next.js image optimization via `next/image` component

### Routing Conventions
- Create new routes by adding folders in `app/` directory
- Use `page.tsx` for route content, `layout.tsx` for shared layouts
- Loading states: `loading.tsx`, Error boundaries: `error.tsx`
- API routes go in `app/api/[route]/route.ts`

### Styling Best Practices
- Prefer Tailwind utility classes over custom CSS
- Use CSS variables for theme values (defined in `globals.css`)
- Font classes auto-generated: `font-sans`, `font-mono`
- Maintain dark mode compatibility with all new styles

### Type Safety
- All files should use `.tsx` extension for components
- Leverage TypeScript's strict mode - no implicit any
- Use Next.js type exports (`Metadata`, `NextConfig`, etc.)
- Define proper prop types for all components
