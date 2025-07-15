# Skyfire Solutions Crawler Bot Protection Proxy

A Node.js/Express proxy service with bot protection and Redis-based usage tracking.

## 🚀 Features

- **Payment Integration**: Real-time token charging via Skyfire API
- **JWT Token Verification**: Validates Skyfire payment tokens
- **Batch Charging**: Configurable threshold-based charging
- **Usage Tracking**: Redis-based session management with request counting

## 📋 Prerequisites

- Node.js >= 18.0.0
- Docker Environment
- Approved Seller Service with Seller Skyfire API Key

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone git@github.com:skyfire-xyz/skyfire-solutions-crawler-bot-protection-proxy.git
   cd skyfire-solutions-crawler-bot-protection-proxy
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   **Note**: You need an approved seller service and seller API key to charge amounts.

4. **Start the development environment**

   ```bash
   docker-compose up
   ```

   This starts both Redis and the application with hot reloading enabled.

## ⚙️ Configuration

### Environment Variables

| Variable                  | Description             | Default                                                |
| ------------------------- | ----------------------- | ------------------------------------------------------ |
| `SKYFIRE_API_URL`         | Skyfire API URL         | https://api.skyfire.xyz                                |
| `SKYFIRE_SELLER_API_KEY`  | Seller API key          | Required                                               |
| `SELLER_SERVICE_ID`       | Seller service ID       | Required                                               |
| `SELLER_SERVICE_AGENT_ID` | Seller agent ID         | Required                                               |
| `PROXY_TARGET`            | Target URL for proxying | Demo URL (https://demo-real-estate-prv4.onrender.com/) |
