import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://quickconvert.dev'
  
  const tools = [
    { slug: 'base64-converter', priority: 0.8, changeFreq: 'weekly' as const },
    { slug: 'aes-256-encryption', priority: 0.8, changeFreq: 'weekly' as const },
    { slug: 'json-formatter', priority: 0.8, changeFreq: 'weekly' as const },
    { slug: 'jwt-decoder', priority: 0.7, changeFreq: 'weekly' as const },
    { slug: 'hash-generator', priority: 0.7, changeFreq: 'weekly' as const },
    { slug: 'bcrypt-password', priority: 0.7, changeFreq: 'weekly' as const },
    { slug: 'color-converter', priority: 0.6, changeFreq: 'weekly' as const },
    { slug: 'url-tools', priority: 0.6, changeFreq: 'weekly' as const },
    { slug: 'cron-translator', priority: 0.6, changeFreq: 'weekly' as const },
    { slug: 'regex-tester', priority: 0.6, changeFreq: 'weekly' as const },
  ]

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...tools.map(tool => ({
      url: `${baseUrl}/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: tool.changeFreq,
      priority: tool.priority,
    })),
  ]
}