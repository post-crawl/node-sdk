/**
 * Basic search example for PostCrawl SDK
 */

import 'dotenv/config'
import { PostCrawlClient } from '../src'

async function main() {
  // Initialize the client
  const client = new PostCrawlClient({
    apiKey: process.env.POSTCRAWL_API_KEY || 'sk_your_api_key_here',
  })

  try {
    // Search for AI content on Reddit
    console.log('Searching for AI content on Reddit...\n')
    
    const results = await client.search({
      socialPlatforms: ['reddit'],
      query: 'artificial intelligence breakthrough',
      results: 5,
      page: 1,
    })

    // Display results
    console.log(`Found ${results.length} results:\n`)
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`)
      console.log(`   URL: ${result.url}`)
      console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`)
      console.log(`   Date: ${result.date}`)
      if (result.imageUrl) {
        console.log(`   Image: ${result.imageUrl}`)
      }
      console.log()
    })

    // Display rate limit info
    console.log('Rate Limit Info:')
    console.log(`  Limit: ${client.rateLimitInfo.limit}`)
    console.log(`  Remaining: ${client.rateLimitInfo.remaining}`)
    console.log(`  Reset: ${client.rateLimitInfo.reset ? new Date(client.rateLimitInfo.reset * 1000).toLocaleString() : 'N/A'}`)

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the example
main()