import { CheerioCrawler, RequestQueue } from 'crawlee'
import {
  DEFAULT_DEPTH,
  DEFAULT_REQUESTS,
  MAX_DEPTH,
  MAX_REQUESTS,
  MessageType,
  PaidStatus,
  CrawlResult,
  PageResult
} from './types'
import {
  encodeHTML,
  fetchRobotsTxt,
  parseRobotsTxt,
  triggerCrawlEvent,
} from './crawlerUtils'

import { addCrawler, stopAndRemoveCrawler } from './crawlerRegistry'
import { skyfirePayTokenHook } from './skyfirePayTokenHook'

export async function crawlWebsite({
  startUrl,
  channelId,
  inputRequests = DEFAULT_REQUESTS,
  inputDepth = DEFAULT_DEPTH,
  skyfireKyaPayToken
}: {
  startUrl: string
  channelId: string
  inputRequests?: number
  inputCost?: number
  inputDepth?: number
  skyfireKyaPayToken?: string
}): Promise<CrawlResult> {
  try {
    const sUrl = new URL(startUrl)
    console.log(`Starting crawl for ${sUrl.host}...`)
  } catch {
    throw new Error("Invalid URL")
  }

  inputRequests = inputRequests > MAX_REQUESTS ? MAX_REQUESTS : inputRequests
  inputDepth = inputDepth > MAX_DEPTH ? MAX_DEPTH : inputDepth
  const results: PageResult[] = []
  const requestQueue = await RequestQueue.open()
  const robotsTxt = await fetchRobotsTxt(startUrl, channelId)
  const robotsData = parseRobotsTxt(robotsTxt)
  const startTimeOverall = Date.now()
  let totalCost = 0
  let totalTraversalSizeBytes = 0
              
  if (
    robotsData.disallowedPaths.has('/') ||
    robotsData.disallowedPaths.has('/*')
  ) {
    return {
      results: [],
      totalCost: 0,
      totalTimeSeconds: 0,
      totalTraversalSizeBytes: 0
    }
  }
  requestQueue.timeoutSecs = 5
  console.log(`Starting crawl for ${startUrl}...`)
  await requestQueue.addRequest({ url: startUrl, userData: { depth: 0 } })
  
  let crawler: CheerioCrawler
  crawler = new CheerioCrawler({
    requestQueue,
    maxRequestsPerCrawl: inputRequests,
    maxRequestRetries: 0,
    requestHandlerTimeoutSecs: 5,
    additionalMimeTypes: ['application/json'],
    preNavigationHooks: [skyfirePayTokenHook(skyfireKyaPayToken)],

    // Function that will be called for each URL to process the HTML content
    requestHandler: async ({ request, response, body, enqueueLinks }) => {
      totalTraversalSizeBytes += body.length

      const rawHTML1 = body.toString()
      const rawHTMLShort1 = rawHTML1.substring(0, 4000) // Pusher has a 10KB limit
      const content1 = encodeHTML(rawHTMLShort1)

      if (response?.statusCode !== 200) {
        await triggerCrawlEvent(
          {
            message: {
              type: MessageType.ERROR,
              paid: PaidStatus.FAILED,
              request: {url: `Request to ${request.url} failed. Status: ${response.statusCode}`, headers:request.headers,  method:request.method}, 
              response: { text: `${content1}`, url: request.url, headers: response.headers},
            },
          },
          channelId
        ).catch((error) => {
          console.error('Error triggering Pusher event:', error)
        })
        // Stop the crawler immediately
        stopAndRemoveCrawler(channelId, "error response")
        return
      }

      const {
        url,
        userData: { depth }
      } = request
      console.log(`Processing ${url} at depth ${depth}...`)

      const rawHTML = body.toString()
      const rawHTMLShort = rawHTML.substring(0, 4000) // Pusher has a 10KB limit
      const content = encodeHTML(rawHTMLShort)
      const messageData = {
        message: {
          type: MessageType.PAGE,
          request: {url: url, headers: request.headers,  method: request.method.toString()}, 
          response: {text: content, url: url, headers: response.headers}, 
          depth,
        }
      }
      results.push(messageData.message)

      await triggerCrawlEvent(messageData, channelId)

      if (depth < inputDepth) {
        await enqueueLinks({
          strategy: 'same-domain'
        })
      }
    },

    failedRequestHandler({ request, error }) {
      const errorMessage = `Request to ${request.url} failed with ${request.errorMessages[0]?.split('.')[0]}`
      if (!request.url.includes('robots.txt')) {
        const errorData = {
          message: {
            type: MessageType.PAGE,
            response: {text: errorMessage, headers: {}},
            request: {url: request.url, headers: request.headers}
          }
        }
        triggerCrawlEvent(errorData, channelId).catch((error) => {
          console.error('Error triggering Pusher event:', error)
        })
      }
      console.error(error)
    },

    // Limit the concurrency to avoid overwhelming the server
    minConcurrency: 1,
    maxConcurrency: 1
  })

  addCrawler(channelId, crawler) // Add the crawler to the running crawlers registry
  
  await crawler.run() // Start the crawler
  
  stopAndRemoveCrawler(channelId, "finished execution") // Remove the crawler from the running crawlers registry when finished
  await requestQueue.drop()
  const totalTimeSeconds = (Date.now() - startTimeOverall) / 1000
  console.log(`Crawler finished. channelId: ${channelId}`)
  console.log(`Total cost: ${totalCost}`)
  console.log(`Total crawl time: ${totalTimeSeconds}`)
  console.log(`Total traversal size: ${totalTraversalSizeBytes}`)
  return {
    results,
    totalCost,
    totalTimeSeconds,
    totalTraversalSizeBytes
  }
}