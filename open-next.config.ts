import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue'

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  // Without a queue override, OpenNext logs "Dummy queue is not implemented"
  // and revalidation of a stale ISR page is forced inline on the request hot
  // path — re-rendering a Notion recordMap there blows the Workers Free 10ms
  // CPU cap and returns HTTP 503 (error 1102). The memory queue revalidates in
  // the background via a HEAD self-request (waitUntil), so user requests are
  // served the cached/stale page cheaply instead of rendering inline.
  // Requires the WORKER_SELF_REFERENCE service binding in wrangler.jsonc.
  queue: memoryQueue
})
