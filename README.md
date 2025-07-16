# Smart Web Crawler Demo

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

Here is a video for the running crawler demo:
(TODO: replace with GIF)
![Running Crawler Demo Video](https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/blob/main/crawler/public/static/videos/running_crawler_demo.mov)

### Flow

Here is a diagram explaining the flow:
![Flow Diagram](https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo/blob/main/static/images/crawler_flow.png?raw=true)


### Pre-requisites

To run this demo, 
- Follow the [Skyfire Platform Setup Guide](https://docs.skyfire.xyz/docs/introduction) to create Skyfire API key, complete Buyer and Seller Onboarding.

### Contents: 

- Crawler Agent
- Crawler Service
- Bot Protection Proxy
- Protected Website

### Installation Steps

1.  Clone the repository:
    ```bash
    git clone https://github.com/skyfire-xyz/skyfire-solutions-smart-web-crawler-demo.git
    ```
2. Follow installation instructions in each sub-directory


### Note:
Take a look at the live demo [here](https://crawler-demo.skyfire.xyz/).