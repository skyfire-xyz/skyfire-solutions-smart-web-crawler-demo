# Crawler Demo

In this demo, we’ll explore how Skyfire enables seamless, token-based payments for crawling protected websites, and how its batch-based charging model benefits both data providers and consumers.

### The Problem: Crawling Protected Content

Traditional web crawlers often hit a wall when they encounter protected content. Website owners want to monetize their data, while authorized crawlers need a way to pay for access.

### The Solution: Skyfire’s KYA+PAY Token

Skyfire introduces a **token-based payment system** that allows crawlers to access protected content in a secure, auditable, and automated way. Here’s how it works:

- **Token Generation:** The crawler agent requests a KYA+PAY token from Skyfire’s API, specifying the amount of access or data required.
- **Token Submission:** The crawler includes the token in the HTTP headers of its requests to the protected website.
- **Batch-Based Charging:** Instead of charging for every single request, the protected website can **charge tokens in batches**—for example, after every 10 pages crawled, a single token deduction is made. This reduces transaction overhead and makes the process more efficient for both parties.
- **Verification and Enforcement:** The protected website verifies the token and tracks usage, ensuring that only authorized crawlers with sufficient balance can access the data.

### Live Demo Link

You can play with the live demo [here](https://crawler-demo.skyfire.xyz/).

Here is a GIF for the running crawler demo:
![Running Crawler Demo GIF](https://github.com/skyfire-xyz/skyfire-solutions-crawler-demo/blob/main/static/images/running_crawler_demo.mov)

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
   yarn install
   ```

3. Create a .env file in the root of the project folder with the following environment variables set to your information:

   ```
   NEXT_PUBLIC_PUSHER_KEY=<your_pusher_key>
   NEXT_PUBLIC_PUSHER_CLUSTER=<your_pusher_cluster>
   NEXT_PUBLIC_SELLER_SERVICE_NAME=Real Estate Website
   NEXT_PUBLIC_DEFAULT_TOKEN_AMOUNT=<minimum_token_amount_for_your_seller_service>
   NEXT_PUBLIC_PRICE_DISPLAY=<display_price_for_your_seller_service>
   NEXT_PUBLIC_SERVICE_BASE_URL=<your_crawler_service_local_url>
   ```

4. Start the development server

   ```
   yarn dev
   ```

Your Next.js app should now be running on `http://localhost:3000`.
