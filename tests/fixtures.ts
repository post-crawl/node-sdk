/**
 * Test fixtures for PostCrawl SDK tests.
 */

export const apiKey = 'sk_test_1234567890abcdef'
export const invalidApiKey = 'invalid_key'

export const mockSearchResponse = [
  {
    title: 'Understanding Machine Learning Basics',
    url: 'https://www.reddit.com/r/MachineLearning/comments/abc123/understanding_ml_basics/',
    snippet:
      'A comprehensive guide to machine learning fundamentals including supervised and unsupervised learning...',
    date: 'Dec 28, 2024',
    imageUrl: 'https://preview.redd.it/ml-basics.jpg',
  },
  {
    title: 'AI Revolution in 2024',
    url: 'https://www.reddit.com/r/artificial/comments/def456/ai_revolution_2024/',
    snippet:
      'The rapid advancement of AI technology in 2024 has brought significant changes to various industries...',
    date: 'Dec 27, 2024',
    imageUrl: '',
  },
]

export const mockRedditPost = {
  id: '1ab2c3d',
  url: 'https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/',
  title: 'Test Post Title',
  name: 'testuser',
  subredditName: 'Python',
  score: 42.0,
  upvotes: 40.0,
  downvotes: 2.0,
  createdAt: '2023-12-28T00:00:00Z',
  description: 'This is the post content.',
  comments: [
    {
      id: 'comment1',
      text: 'Great post!',
      score: 5.0,
      upvotes: 5.0,
      downvotes: 0.0,
      createdAt: '2023-12-28T00:06:40Z',
      parentId: '1ab2c3d',
      permalink: '/r/Python/comments/1ab2c3d/test_post/comment1',
      replies: [],
    },
  ],
}

export const mockTiktokPost = {
  id: '7123456789012345678',
  description: 'Check out this amazing Python tutorial! #python #coding #programming',
  createdAt: '2023-12-28T00:00:00Z',
  url: 'https://www.tiktok.com/@pythontutor/video/7123456789012345678',
  username: 'pythontutor',
  likes: '1.5K',
  totalComments: 50.0,
  hashtags: ['python', 'coding', 'programming'],
  comments: [
    {
      id: '7123456789012345679',
      text: 'This is so helpful!',
      createdAt: '2023-12-28T00:06:40Z',
      likes: 10.0,
      username: 'learner123',
      nickname: 'Python Learner',
      avatarUrl: 'https://p16.tiktokcdn.com/avatar2.jpg',
      replies: [],
    },
  ],
}

export const mockExtractResponse = [
  {
    url: 'https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/',
    source: 'reddit',
    raw: {
      id: '1ab2c3d',
      name: 't3_1ab2c3d',
      title: 'Test Post Title',
      url: 'https://www.reddit.com/r/Python/comments/1ab2c3d/test_post/',
      description: 'This is the post content.',
      subredditName: 'Python',
      upvotes: 42.0,
      downvotes: 2.0,
      score: 40.0,
      createdAt: '2023-12-28T00:00:00Z',
      comments: [],
    },
    markdown: null,
    error: null,
  },
  {
    url: 'https://www.tiktok.com/@pythontutor/video/7123456789012345678',
    source: 'tiktok',
    raw: {
      id: '7123456789012345678',
      username: 'pythontutor',
      url: 'https://www.tiktok.com/@pythontutor/video/7123456789012345678',
      description: 'Check out this amazing Python tutorial!',
      createdAt: '2023-12-28T00:00:00Z',
      comments: [],
      hashtags: ['python', 'tutorial'],
      likes: '1500',
      totalComments: 50.0,
    },
    markdown: null,
    error: null,
  },
  {
    url: 'https://invalid.url/post',
    source: 'reddit', // Must be 'reddit' or 'tiktok' per the Literal type
    raw: null,
    markdown: null,
    error: 'Failed to extract content: Invalid URL',
  },
]

export const mockErrorResponse = {
  error: 'validation_error',
  message: 'Validation failed',
  request_id: 'req_123456',
  details: [{ field: 'query', code: 'invalid_value', message: 'Query cannot be empty' }],
}

export const mockRateLimitHeaders = {
  'X-RateLimit-Limit': '200',
  'X-RateLimit-Remaining': '150',
  'X-RateLimit-Reset': '1703725200',
  'Retry-After': '60',
}