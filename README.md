# Flight Finder Agent

A web-based flight finding tool that accepts complex natural language queries and leverages AI to find the best flights for you.

## Features

- Natural language query processing
- Integration with Google Flights data
- Optional browser extension for enhanced performance
- Intuitive UI for flight results

## Architecture

- **Frontend**: React/Vite web application
- **Backend**: Serverless functions (Cloudflare Workers/Vercel Functions)
- **LLM Integration**: OpenRouter API for natural language understanding
- **Browser Extension**: Optional component for enhanced data retrieval

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Account on OpenRouter for API access
- Account on Cloudflare/Vercel for deployment

### Development

1. Install dependencies: `pnpm install`
2. Start webapp development server: `pnpm dev:webapp`
3. Start proxy development server: `pnpm dev:proxy`
4. Load the extension in developer mode from the `/extension` directory

## Deployment

See the deployment section in the documentation for details on deploying the webapp and proxy components, and distributing the browser extension.