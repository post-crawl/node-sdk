/**
 * Search and extract example for PostCrawl SDK
 */

import 'dotenv/config'
import { PostCrawlClient, RedditPost, TiktokPost } from '../src'

async function main() {
  // Initialize the client
  const client = new PostCrawlClient({
    apiKey: process.env.POSTCRAWL_API_KEY || 'sk_your_api_key_here',
  })

  try {
    console.log('Searching and extracting Python tutorials...\n')

    // Search and extract in one operation
    const posts = await client.searchAndExtract({
      socialPlatforms: ['reddit', 'tiktok'],
      query: 'python programming tutorial beginner',
      results: 3,
      page: 1,
      includeComments: true,
      responseMode: 'raw',
    })

    console.log(`Found and extracted ${posts.length} posts:\n`)

    // Process each post
    posts.forEach((post, index) => {
      console.log(`\n${'='.repeat(50)}`)
      console.log(`Post ${index + 1} from ${post.source}`)
      console.log('='.repeat(50))

      if (post.error) {
        console.log(`Error extracting content: ${post.error}`)
        return
      }

      // Reddit content
      if (post.source === 'reddit' && post.raw) {
        const reddit = post.raw as RedditPost
        console.log(`\n📱 Reddit Post`)
        console.log(`Title: ${reddit.title}`)
        console.log(`Subreddit: r/${reddit.subredditName}`)
        console.log(`Author: u/${reddit.name || 'unknown'}`)
        console.log(`Score: ${reddit.score} (↑${reddit.upvotes} ↓${reddit.downvotes})`)
        console.log(`URL: ${reddit.url}`)
        console.log(`\nContent Preview:`)
        console.log(reddit.description.substring(0, 300) + '...')

        if (reddit.comments && reddit.comments.length > 0) {
          console.log(`\n💬 Comments (${reddit.comments.length} total):`)
          reddit.comments.slice(0, 2).forEach((comment, idx) => {
            console.log(`  ${idx + 1}. "${comment.text.substring(0, 100)}..."`)
            console.log(`     Score: ${comment.score}, Replies: ${comment.replies?.length || 0}`)
          })
        }
      }

      // TikTok content
      if (post.source === 'tiktok' && post.raw) {
        const tiktok = post.raw as TiktokPost
        console.log(`\n🎵 TikTok Video`)
        console.log(`Creator: @${tiktok.username}`)
        console.log(`Description: ${tiktok.description}`)
        console.log(`Likes: ${tiktok.likes}`)
        console.log(`Total Comments: ${tiktok.totalComments}`)
        console.log(`Hashtags: ${tiktok.hashtags.map(tag => `#${tag}`).join(' ')}`)
        console.log(`URL: ${tiktok.url}`)

        if (tiktok.comments && tiktok.comments.length > 0) {
          console.log(`\n💬 Top Comments:`)
          tiktok.comments.slice(0, 2).forEach((comment, idx) => {
            console.log(`  ${idx + 1}. @${comment.username}: "${comment.text}"`)
            console.log(`     Likes: ${comment.likes}`)
          })
        }
      }
    })

    // Show rate limit status
    console.log(`\n${'='.repeat(50)}`)
    console.log('API Usage:')
    console.log(`  Credits Remaining: ${client.rateLimitInfo.remaining}/${client.rateLimitInfo.limit}`)
    if (client.rateLimitInfo.reset) {
      const resetTime = new Date(client.rateLimitInfo.reset * 1000)
      console.log(`  Reset Time: ${resetTime.toLocaleString()}`)
    }

  } catch (error: any) {
    console.error('\n❌ Error occurred:')
    console.error(`  Type: ${error.constructor.name}`)
    console.error(`  Message: ${error.message}`)
    
    if (error.details) {
      console.error('  Details:', error.details)
    }
    
    if (error.retryAfter) {
      console.error(`  Retry After: ${error.retryAfter} seconds`)
    }
  }
}

// Run the example
main()