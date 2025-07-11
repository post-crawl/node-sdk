/**
 * Basic extract example for PostCrawl SDK
 */

import 'dotenv/config'
import { PostCrawlClient, RedditPost, TiktokPost } from '../src'

async function main() {
  // Initialize the client
  const client = new PostCrawlClient({
    apiKey: process.env.POSTCRAWL_API_KEY || 'sk_your_api_key_here',
  })

  try {
    // Example URLs (replace with actual URLs)
    const urls = [
      'https://www.reddit.com/r/MachineLearning/comments/...',
      'https://www.tiktok.com/@techexplainer/video/...',
    ]

    console.log('Extracting content from URLs...\n')

    const posts = await client.extract({
      urls,
      includeComments: true,
      responseMode: 'raw',
    })

    // Process each extracted post
    posts.forEach((post, index) => {
      console.log(`\n--- Post ${index + 1} ---`)
      console.log(`URL: ${post.url}`)
      console.log(`Source: ${post.source}`)

      if (post.error) {
        console.log(`Error: ${post.error}`)
        return
      }

      // Handle Reddit posts
      if (post.source === 'reddit' && post.raw) {
        const reddit = post.raw as RedditPost
        console.log(`\nReddit Post:`)
        console.log(`  Title: ${reddit.title}`)
        console.log(`  Subreddit: r/${reddit.subredditName}`)
        console.log(`  Score: ${reddit.score} (↑${reddit.upvotes} ↓${reddit.downvotes})`)
        console.log(`  Created: ${new Date(reddit.createdAt).toLocaleString()}`)
        console.log(`  Content: ${reddit.description.substring(0, 200)}...`)
        
        if (reddit.comments && reddit.comments.length > 0) {
          console.log(`  Comments: ${reddit.comments.length}`)
          console.log(`  Top comment: "${reddit.comments[0].text.substring(0, 100)}..."`)
        }
      }

      // Handle TikTok posts
      if (post.source === 'tiktok' && post.raw) {
        const tiktok = post.raw as TiktokPost
        console.log(`\nTikTok Post:`)
        console.log(`  Username: @${tiktok.username}`)
        console.log(`  Description: ${tiktok.description}`)
        console.log(`  Likes: ${tiktok.likes}`)
        console.log(`  Comments: ${tiktok.totalComments}`)
        console.log(`  Hashtags: ${tiktok.hashtags.join(', ')}`)
        console.log(`  Created: ${new Date(tiktok.createdAt).toLocaleString()}`)

        if (tiktok.comments && tiktok.comments.length > 0) {
          console.log(`  Top comment: "@${tiktok.comments[0].username}: ${tiktok.comments[0].text}"`)
        }
      }
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the example
main()