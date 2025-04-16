# Flight Finder Agent

A web-based flight finding tool that accepts complex natural language queries and leverages AI to find the best flights for you.

![Flight Finder Screenshot](./screenshot.png)

## Features

- **Natural Language Flight Search**: Simply describe your travel needs in plain language
- **AI-Powered Understanding**: Our agent interprets your query and creates a smart search plan
- **Multi-Source Flight Data**: Optional browser extension fetches real-time data from Google Flights
- **Visual Presentation**: View results in a list or calendar format with rich filtering options
- **Saved Searches**: Store and reuse your favorite flight queries
- **Intelligent Refinement**: Provide feedback to the agent to refine your search results

## Architecture

This project follows an "Extension-Enhanced Pragmatist" architecture with Agentic Orchestration:

- **Frontend (Orchestrator Agent / UI Agent)**: React/Vite app that manages the UI, flow, and coordinates other agents
- **Proxy (Secure Gateway)**: Serverless function that securely interfaces with the LLM
- **LLM (Reasoning/Planning Agent)**: External LLM that interprets queries, plans steps, and provides reasoning
- **Browser Extension (Data Agent)**: Optional component that fetches real-time flight data

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Account on OpenRouter for API access
- Account on Cloudflare/Vercel for deployment

### Local Development

1. Clone the repository: `git clone https://github.com/yourusername/flight-finder-agent.git`
2. Install dependencies: `pnpm install`
3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add `OPENROUTER_API_KEY=your_api_key_here`
4. Start the development servers:
   - Frontend: `pnpm dev:webapp`
   - Proxy: `pnpm dev:proxy`
5. Load the extension in Chrome/Firefox developer mode:
   - Navigate to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `/extension` directory

### Building for Production

1. Build all components: `pnpm build`
2. The webapp will be available in `webapp/dist`
3. The proxy serverless function will be in `proxy/dist`
4. The extension files will be ready in `extension/dist`

### Deployment

#### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure the environment variables (OPENROUTER_API_KEY)
4. Deploy

#### Extension Publishing

1. Zip the contents of the `extension/dist` directory
2. Upload to the Chrome Web Store and/or Firefox Add-ons marketplace
3. Follow the browser-specific review process guidelines

## Project Structure

- `/webapp`: Frontend React application
- `/proxy`: Serverless proxy function
- `/extension`: Browser extension for data fetching
- `/docs`: Documentation files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.