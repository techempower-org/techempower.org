/**
 * AWS Bedrock client for Cloudflare Workers via Cloudflare AI Gateway.
 *
 * Implements SigV4 signing with the Web Crypto API (no AWS SDK — the SDK is
 * ~1 MiB and our worker bundle is already near the 3 MiB free-plan cap).
 * Requests are POSTed at the AI Gateway URL but signed for the AWS Bedrock
 * host so AWS validates the signature unchanged when CF forwards it.
 *
 * Models:
 *   - `us.anthropic.claude-opus-4-7`               main assistant
 *   - `anthropic.claude-haiku-4-5-20251001-v1:0`   topic classifier
 */

export interface BedrockEnv {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
  /**
   * Optional Cloudflare AI Gateway base URL up to (but not including)
   * `/aws-bedrock`, e.g.
   * `https://gateway.ai.cloudflare.com/v1/<account>/<gateway>`. When empty,
   * Bedrock is called directly via `bedrock-runtime.<region>.amazonaws.com`.
   */
  AI_GATEWAY_BASE?: string
}

const AWS_SERVICE = 'bedrock'

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface InvokeOptions {
  modelId: string
  system: string
  messages: AnthropicMessage[]
  maxTokens: number
  temperature?: number
}

export interface InvokeResult {
  text: string
  inputTokens: number
  outputTokens: number
  stopReason: string
}

/**
 * Invokes a Claude model on Bedrock via the AI Gateway and returns the full
 * response. Non-streaming — picks a smaller round-trip surface area at the
 * cost of latency-to-first-token. Worth revisiting once we settle on real
 * AWS eventstream parsing.
 */
export async function invokeBedrock(
  env: BedrockEnv,
  opts: InvokeOptions
): Promise<InvokeResult> {
  // Opus 4.7 deprecates the `temperature` parameter (Bedrock rejects with
  // 400 if sent). Only include it when the caller explicitly passes one.
  // Haiku still accepts it.
  const requestBody: Record<string, unknown> = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: opts.messages
  }
  if (typeof opts.temperature === 'number') {
    requestBody.temperature = opts.temperature
  }
  const body = JSON.stringify(requestBody)

  const awsHost = `bedrock-runtime.${env.AWS_REGION}.amazonaws.com`
  // AWS SigV4 path is the path AWS sees — same whether we go direct or
  // through AI Gateway (gateway forwards the request unchanged).
  const awsPath = `/model/${encodeURIComponent(opts.modelId)}/invoke`

  const gatewayBase = (env.AI_GATEWAY_BASE ?? '').trim()
  const url = gatewayBase
    ? `${gatewayBase.replace(/\/+$/, '')}/aws-bedrock/bedrock-runtime/${env.AWS_REGION}/model/${encodeURIComponent(opts.modelId)}/invoke`
    : `https://${awsHost}${awsPath}`

  const signed = await sigv4Sign({
    method: 'POST',
    host: awsHost,
    path: awsPath,
    body,
    region: env.AWS_REGION,
    service: AWS_SERVICE,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  })

  // When routed through Cloudflare AI Gateway, opt into response caching via
  // per-request header. Cache key is derived from the request body, so
  // identical prompts return cached responses (and skip Bedrock entirely).
  // 1h TTL is a balance between freshness and cost — guides/programs don't
  // change minute-to-minute. The header is no-op on direct Bedrock calls.
  const cacheHeaders: Record<string, string> = gatewayBase
    ? {
        'cf-aig-cache-ttl': '3600',
        'cf-aig-metadata': JSON.stringify({ model: opts.modelId })
      }
    : {}

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...signed.headers, ...cacheHeaders },
    body
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(
      `Bedrock invoke failed: ${res.status} ${res.statusText}${
        errBody ? ` — ${errBody.slice(0, 300)}` : ''
      }`
    )
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>
    usage?: { input_tokens: number; output_tokens: number }
    stop_reason?: string
  }

  const text =
    data?.content
      ?.filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('') ?? ''

  return {
    text,
    inputTokens: data?.usage?.input_tokens ?? 0,
    outputTokens: data?.usage?.output_tokens ?? 0,
    stopReason: data?.stop_reason ?? 'unknown'
  }
}

// ---------------------------------------------------------------------------
// SigV4 (minimal, Web Crypto)
// ---------------------------------------------------------------------------

interface SigV4Input {
  method: string
  host: string
  path: string
  body: string
  region: string
  service: string
  accessKeyId: string
  secretAccessKey: string
}

async function sigv4Sign(
  input: SigV4Input
): Promise<{ headers: Record<string, string> }> {
  const now = new Date()
  const amzDate = isoDate(now) // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8) // YYYYMMDD
  const payloadHash = await sha256Hex(input.body)

  const headers: Record<string, string> = {
    host: input.host,
    'content-type': 'application/json',
    accept: 'application/json',
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash
  }

  const signedHeaderNames = Object.keys(headers).toSorted()
  const canonicalHeaders = signedHeaderNames
    .map((h) => `${h}:${(headers[h] ?? '').trim().replaceAll(/\s+/g, ' ')}\n`)
    .join('')
  const signedHeaders = signedHeaderNames.join(';')

  const canonicalRequest = [
    input.method,
    input.path,
    '', // query string (none)
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')

  const credentialScope = `${dateStamp}/${input.region}/${input.service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest)
  ].join('\n')

  const kDate = await hmac(`AWS4${input.secretAccessKey}`, dateStamp)
  const kRegion = await hmac(kDate, input.region)
  const kService = await hmac(kRegion, input.service)
  const kSigning = await hmac(kService, 'aws4_request')
  const signature = bufToHex(await hmac(kSigning, stringToSign))

  const authorization = `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    headers: {
      ...headers,
      authorization
    }
  }
}

function isoDate(d: Date): string {
  return d
    .toISOString()
    .replaceAll(/[:-]/g, '')
    .replace(/\.\d{3}/, '')
}

async function sha256Hex(s: string | Uint8Array): Promise<string> {
  const data = typeof s === 'string' ? new TextEncoder().encode(s) : s
  // Web Crypto wants a strict ArrayBuffer; copy out of Uint8Array view to
  // satisfy stricter TS lib types in newer @cloudflare/workers-types.
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new Uint8Array(data).slice().buffer
  )
  return bufToHex(new Uint8Array(hash))
}

async function hmac(
  key: string | ArrayBuffer | Uint8Array,
  data: string
): Promise<Uint8Array> {
  const keyBuf =
    typeof key === 'string'
      ? new TextEncoder().encode(key)
      : key instanceof Uint8Array
        ? key
        : new Uint8Array(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(keyBuf).slice().buffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(data)
  )
  return new Uint8Array(sig)
}

function bufToHex(buf: Uint8Array): string {
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('')
}
