# Architecture

## High Level
GitHub → Cloudflare → Live Site

## Component Strategy
- Shared components: Navbar, Footer, Layout, Cards, Buttons.
- Reusable across Apps, Games, and Blog.

## Deployment
- Cloudflare Pages (Auto-deploy on Git push).

## Scaling
- Start with Simple React/Next.js.
- Later: API routes, Database, Auth.