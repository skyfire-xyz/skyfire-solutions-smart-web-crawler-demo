# Crawler Service Demo

In this demo, we’ll explore how Skyfire enables seamless, token-based payments for crawling protected websites, and how its batch-based charging model benefits both data providers and consumers.

### The Problem: Crawling Protected Content

Traditional web crawlers often hit a wall when they encounter protected content. Website owners want to monetize their data, while authorized crawlers need a way to pay for access.

### The Solution: Skyfire’s KYA+PAY Token

Skyfire introduces a **token-based payment system** that allows crawlers to access protected content in a secure, auditable, and automated way. Here’s how it works:

- **Token Generation:** The crawler agent requests a KYA+PAY token from Skyfire’s API, specifying the amount of access or data required.
- **Token Submission:** The crawler includes the token in the HTTP headers of its requests to the protected website.
- **Batch-Based Charging:** Instead of charging for every single request, the protected website can **charge tokens in batches**—for example, after every 10 pages crawled, a single token deduction is made. This reduces transaction overhead and makes the process more efficient for both parties.
- **Verification and Enforcement:** The protected website verifies the token and tracks usage, ensuring that only authorized crawlers with sufficient balance can access the data.

### Pre-requisites

1. Approved Seller Service with Seller Skyfire API Key

2. Pusher Credentials

- Create a Pusher Account and App:
      - Go to the Pusher website and create a new account or sign in to your existing one. 
      - Navigate to the Pusher Channels dashboard and create a new app. 
      - Give your app a name and select a cluster (region) closest to your users to minimize latency. 

- Get Your Pusher Credentials:
      - After creating the app, find and click on it in the dashboard. 
      - Go to the "App Keys" tab to find your app_id, key, secret, and cluster. 
      - Store these credentials securely, as they will be needed to configure your application. 

### Installation Steps

If you would like to run this app locally -

1. Clone the main branch

2. Install dependencies

   ```
   npm install
   ```

3. Create a .env file in the root of the project folder with the following environment variables set to your information:

   ```
   PORT=8080
   PUSHER_KEY=<your_pusher_key>
   PUSHER_APP_ID=<your_pusher_app_id>
   PUSHER_SECRET=<your_pusher_secret>
   PUSHER_CLUSTER=<your_pusher_cluster>
   PUSHER_USE_TLS=true
   BUYER_TAG=crawl-demo-au3ctqolmc5
   SELLER_SERVICE_ID=<your_skyfire_seller_service_id>
   SKYFIRE_API_KEY=<your_skyfire_api_key>
   SKYFIRE_API_BASE_URL=https://api-qa.skyfire.xyz
   ```

4. Build the code to generate equivalent JavaScript files from TypeScript files. This should create a dist folder in your root directory

   ```
   npm run build
   ```

5. Run the server
   ```
   npm run start
   ```