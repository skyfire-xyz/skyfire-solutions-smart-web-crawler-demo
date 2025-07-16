# Crawler Service

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

### TODO: SkyfireHook with cheerio crawler
```
"x-isbot": "true"
```