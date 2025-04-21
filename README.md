# Stock Trading API - Backend (NestJS)

This project implements the backend REST API for a simplified stock trading simulation application, built with NestJS. It manages user portfolio (cash, holdings) and processes trades, fetching real-time stock prices from the Finnhub API.

## Features

*   **Stock Information:** Provides a list of supported stocks and their current market prices via Finnhub.
*   **Portfolio Management:** Tracks a single user's cash balance and stock holdings (in-memory).
*   **Trade Execution:** Allows buying and selling of supported stocks, validating against available cash or shares.
*   **Real-time Prices:** Uses the Finnhub API to get current stock prices for portfolio valuation and trade execution.

## Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A Finnhub API Key (Free sandbox key available at [finnhub.io](https://finnhub.io/))

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd stock-trading-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Create Environment File:**
    Create a `.env` file in the root of the backend project directory:
    ```dotenv
    # .env
    PORT=3000
    FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY_HERE
    ```
    Replace `YOUR_FINNHUB_API_KEY_HERE` with your actual Finnhub API key.

    **Important:** Add `.env` to your `.gitignore` file to prevent committing secrets.

## Running the Application

```bash
# Development mode (with hot-reloading)
npm run start:dev

# Production mode
npm run build
npm run start:prod