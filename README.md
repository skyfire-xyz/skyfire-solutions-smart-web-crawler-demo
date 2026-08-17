# Smart Web Crawler Demo

This demo shows how Skyfire enables token-based payments for crawling protected websites, and how its batch-based charging model benefits both data providers and consumers.

### The Problem: Crawling Protected Content

Traditional web crawlers often hit a wall when they encounter protected content. Website owners want to monetize their data, while authorized crawlers need a way to pay for access.

### The Solution: Skyfire's KYAPay Token

Skyfire introduces a **token-based payment system** that allows crawlers to access protected content in a secure, auditable, and automated way. Here's how it works:

- **Token Generation:** The crawler agent requests a KYAPay token from Skyfire's API, specifying the amount of access or data required.
- **Token Submission:** The crawler includes the token in the `skyfire-pay-id` HTTP header of its requests to the protected website.
- **Batch-Based Charging:** Instead of charging for every single request, the protected website can **charge tokens in batches** — for example, once accumulated charges cross a threshold, a single deduction is made. This reduces transaction overhead and makes the process more efficient for both parties.
- **Verification and Enforcement:** The protected website verifies the token and tracks usage, ensuring that only authorized crawlers with sufficient balance can access the data.

### Live Demo Link

You can play with the live demo [here](https://crawler-demo.skyfire.xyz/).

Here is a [video link](https://youtu.be/onkJ1LlS7q8) for the running crawler demo.

### Flow

Here is a diagram explaining the flow:
![Flow Diagram](https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/blob/main/static/images/crawler_flow.png?raw=true)

### Pre-requisites

- **Node.js 18+** and **npm** (for `crawler-agent-core`) / **Yarn 1.x** (for `crawler-agent-fe` and `crawler-bot-protection-proxy`).
- **Redis** — required by the bot protection proxy for session and usage tracking. A `docker-compose.yml` is provided that runs Redis alongside the proxy.
- **Skyfire API key** — follow the [Skyfire Platform Setup Guide](https://docs.skyfire.xyz/) to create a Skyfire API key and complete Buyer and Seller Onboarding.
- **Pusher account** — the crawler backend streams live crawl events to the frontend over Pusher Channels. You will need an `app_id`, `key`, `secret`, and `cluster`.

### Repository Layout

```
crawler-agent-fe/               Next.js frontend (yarn)
crawler-agent-core/             Express + Crawlee crawler backend (npm)
crawler-bot-protection-proxy/   Express + Redis payment proxy (yarn, Docker)
scripts/setup-subtrees.sh       Git subtree helper for syncing the three components
static/images/                  Diagrams used by this README
```

### Contents

This repository contains **three** services. Together with a fourth, externally hosted **Protected Website**, they demonstrate how content owners can monetize their data while giving legitimate crawlers paid access.

1. **Crawler Agent FE** — [`crawler-agent-fe/`](crawler-agent-fe)

- Purpose: Interactive frontend that demonstrates the difference between paid and unpaid crawling.
- Features:
  - Skyfire token management interface
  - Live crawl log streamed over Pusher
  - Demonstrates successful requests (with valid payment tokens) and blocked requests (without)
- Technology: Next.js 15 (App Router), React 18, Tailwind CSS, Radix UI, `pusher-js`
- Runs on `http://localhost:3000`

2. **Crawler Agent Core** — [`crawler-agent-core/`](crawler-agent-core)

- Purpose: Backend service that performs the actual crawling operations.
- Features:
  - Executes crawl requests with and without payment tokens
  - Requests KYAPay tokens from the Skyfire API and injects them via the `skyfireKyaPayTokenHook` pre-navigation hook
  - Fetches and honors `robots.txt`, including Skyfire's `payment-url` and `paid-content` directives
  - Publishes crawl progress to the frontend over Pusher
- Technology: Node.js/Express with [Crawlee](https://crawlee.dev/)'s `CheerioCrawler`, TypeScript
- Runs on `http://localhost:8080`

3. **Bot Protection Proxy** — [`crawler-bot-protection-proxy/`](crawler-bot-protection-proxy)

- Purpose: Acts as the protective barrier and payment processor in front of the protected website.
- Features:
  - Bot identification via the `x-isbot` header; human requests bypass token verification
  - KYAPay token verification — validates `skyfire-pay-id` JWTs (signature, expiry, seller service association)
  - Usage tracking and charging — Redis-based session management with incremental charging and batch processing
  - Request proxying — forwards valid requests to the target website
  - Session expiration — automatic cleanup with final charging on expiry
- Technology: Node.js/Express 5, Redis (`ioredis`), `jose` for JWT verification, `pino` logging, Docker
- Runs on `http://localhost:4000`

4. **Protected Website** (external, not in this repo)

- Available at: [https://demo-real-estate-prv4.onrender.com/](https://demo-real-estate-prv4.onrender.com/)
- Purpose: Simulates valuable content that requires paid access from crawler bots.
- The proxy-fronted version used by the demo is at [https://real-estate-list-scraping-demo.skyfire.xyz/](https://real-estate-list-scraping-demo.skyfire.xyz/).

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo.git
   cd skyfire-solutions-smart-web-crawler-demo
   ```

2. Set up each service. Each sub-directory has its own README with detailed environment variables and setup steps. Start them in this order so that each service's dependency is already running:

   | Order | Service                                                             | Install        | Run             |
   | ----- | ------------------------------------------------------------------- | -------------- | --------------- |
   | 1     | [`crawler-bot-protection-proxy/`](crawler-bot-protection-proxy)      | `yarn install` | `docker-compose up` |
   | 2     | [`crawler-agent-core/`](crawler-agent-core)                          | `npm install`  | `npm start`     |
   | 3     | [`crawler-agent-fe/`](crawler-agent-fe)                              | `yarn install` | `yarn dev`      |

3. Open `http://localhost:3000` in your browser.

### Dependency Policy

All dependency versions in this repository are **pinned to exact versions** (no `^` or `~` ranges) so that installs are reproducible. Where a transitive dependency needs to be forced to a patched version, it is pinned via the `resolutions` field in the relevant `package.json`.

To check for known vulnerabilities:

```bash
cd crawler-agent-core            && npm audit
cd crawler-agent-fe              && yarn audit
cd crawler-bot-protection-proxy  && yarn audit
```

### Note

Take a look at the live demo [here](https://crawler-demo.skyfire.xyz/).
