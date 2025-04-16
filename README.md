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
- **Dark Mode & Mobile Optimized**: Enjoy a beautiful experience on any device at any time
- **Google Authentication**: Quick and secure sign-in with your Google account (primary method)
- **Email Authentication**: Traditional email & password authentication as fallback option
- **Comprehensive Error Handling**: Robust error handling and recovery throughout the application
- **Detailed Logging**: Structured logging with different severity levels for debugging and monitoring
- **Subscription Management**: Different pricing tiers for casual to frequent travelers
- **Enhanced Mobile Experience**: Touch-optimized controls for natural mobile interaction
- **Multi-language Support**: Interface available in multiple languages
- **Trip Planning**: Comprehensive trip management including flights, hotels, and activities
- **Voice Interface**: Natural language voice search capabilities

## Architecture

This project follows an "Extension-Enhanced Pragmatist" architecture with Agentic Orchestration:

- **Frontend (Orchestrator Agent / UI Agent)**: React/Vite app that manages the UI, flow, and coordinates other agents
- **Proxy (Secure Gateway)**: Serverless function that securely interfaces with the LLM
- **LLM (Reasoning/Planning Agent)**: External LLM that interprets queries, plans steps, and provides reasoning
- **Browser Extension (Data Agent)**: Optional component that fetches real-time flight data
- **Authentication**: Supabase for user authentication (Google OAuth and email/password)
- **Payments**: Stripe integration for subscription management
- **Logging & Monitoring**: Structured logging system with error reporting and tracking

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Account on OpenRouter for API access
- Account on Supabase for authentication
- Google OAuth client ID (for Google Sign-In)
- Account on Stripe for payment processing
- Account on Cloudflare/Vercel for deployment

### Local Development

1. Clone the repository: `git clone https://github.com/yourusername/flight-finder-agent.git`
2. Install dependencies: `pnpm install`
3. Set up environment variables:
   - Create a `.env` file in the root directory based on `.env.example`
   - Add your API keys for OpenRouter, Supabase, and Stripe
   - Add your Google OAuth client ID for Google Sign-In
4. Start the development servers:
   - Frontend: `pnpm dev:webapp`
   - Proxy: `pnpm dev:proxy`
5. Load the extension in Chrome/Firefox developer mode:
   - Navigate to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `/extension` directory

### Setting Up Google Authentication

To enable Google Sign-In, you need to:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Configure the OAuth consent screen
3. Create OAuth client ID credentials for a Web Application
4. Add your application's domain to the authorized JavaScript origins
5. Add `https://your-domain.com/auth/callback` to the authorized redirect URIs
6. Add the client ID to your `.env` file as `VITE_GOOGLE_CLIENT_ID`
7. Configure Supabase authentication:
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Google provider
   - Add your Google Client ID and Client Secret
   - Set the authorized redirect URL to `https://your-supabase-project.supabase.co/auth/v1/callback`

### Building for Production

1. Build all components: `pnpm build`
2. The webapp will be available in `webapp/dist`
3. The proxy serverless function will be in `proxy/dist`
4. The extension files will be ready in `extension/dist`

### Deployment

#### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure the environment variables (OPENROUTER_API_KEY, SUPABASE_URL, etc.)
4. Deploy

#### Extension Publishing

1. Zip the contents of the `extension/dist` directory
2. Upload to the Chrome Web Store and/or Firefox Add-ons marketplace
3. Follow the browser-specific review process guidelines

## Subscription Plans

Flight Finder offers several subscription tiers:

- **Free**: Limited searches per month
- **Basic**: 20 searches per month, basic flight details
- **Premium**: 100 searches per month, detailed flight information, price alerts
- **Enterprise**: Unlimited searches, all premium features, API access

## Testing

This project uses Jest and React Testing Library for unit and integration tests:

1. Run all tests: `pnpm test`
2. Run with coverage: `pnpm test:coverage`
3. Run end-to-end tests: `pnpm test:e2e`

### Test Coverage

The project includes comprehensive tests for all major components:

- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing interactions between multiple components
- **Authentication Tests**: Specific tests for Google authentication and Supabase integration
- **Error Handling Tests**: Tests for error scenarios and recovery
- **Accessibility Tests**: Ensuring the application is accessible to all users

## Error Handling and Logging

The application implements robust error handling throughout:

- **Structured Error Types**: Specific error classes for different types of errors
- **Graceful Degradation**: The app remains functional even when parts fail
- **User Feedback**: Clear error messages with recovery options
- **Retry Mechanisms**: Automatic retries for transient failures
- **Comprehensive Logging**: Different log levels for development vs. production

## Project Structure

- `/webapp`: Frontend React application
- `/proxy`: Serverless proxy function
- `/extension`: Browser extension for data fetching
- `/docs`: Documentation files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.