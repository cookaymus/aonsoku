import { logger } from './logger'

// Fire prefetch when this many seconds remain on the current track. Picked
// over a percentage-based threshold so behaviour is consistent across track
// lengths: 30 s gives comfortably more than Octo-Fiesta's 5–15 s upstream
// fetch worst case while keeping the prefetched URL from sitting idle.
export const PREFETCH_LEAD_SECONDS = 30

const prefetched = new Set<string>()
let activeController: AbortController | null = null

async function prefetchNext(songId: string, streamUrl: string): Promise<void> {
  if (prefetched.has(songId)) return
  prefetched.add(songId)

  activeController?.abort()
  const controller = new AbortController()
  activeController = controller

  try {
    // Range: bytes=0-0 asks for just the first byte; the proxy still has to
    // fetch the full file from upstream before serving anything, which is
    // exactly the cache-warming side effect we want. The response body is
    // intentionally not consumed.
    await fetch(streamUrl, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') return
    logger.error('[prefetch] Failed to prefetch next track', error)
  } finally {
    if (activeController === controller) {
      activeController = null
    }
  }
}

function cancel() {
  activeController?.abort()
  activeController = null
}

function reset() {
  cancel()
  prefetched.clear()
}

export const prefetch = {
  prefetchNext,
  cancel,
  reset,
}
