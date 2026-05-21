import { logger } from './logger'

// Fire prefetch when this many seconds remain on the current track. Picked
// over a percentage-based threshold so behaviour is consistent across track
// lengths: 30 s gives comfortably more than Octo-Fiesta's 5–15 s upstream
// fetch worst case while keeping the prefetched URL from sitting idle.
export const PREFETCH_LEAD_SECONDS = 30

// Bounded concurrency for the "Prefetch all" album action. Two keeps Octo-
// Fiesta's upstream load manageable (Qobuz/SquidWTF rate-limit risk) while
// roughly halving wall-clock time vs. strict serial fetching.
export const PREFETCH_ALBUM_CONCURRENCY = 2

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

interface PrefetchItem {
  id: string
  streamUrl: string
}

interface PrefetchAllOptions {
  signal: AbortSignal
  onProgress: (completed: number, total: number) => void
}

async function prefetchAll(
  items: PrefetchItem[],
  { signal, onProgress }: PrefetchAllOptions,
): Promise<void> {
  const todo = items.filter((item) => !prefetched.has(item.id))
  const total = items.length
  let completed = total - todo.length
  onProgress(completed, total)

  if (todo.length === 0) return

  let index = 0

  async function worker() {
    while (true) {
      if (signal.aborted) return
      const i = index++
      if (i >= todo.length) return
      const item = todo[i]
      prefetched.add(item.id)
      try {
        await fetch(item.streamUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          signal,
        })
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // Un-claim the slot so a future bulk run can retry it.
          prefetched.delete(item.id)
          return
        }
        logger.error('[prefetch] Failed to bulk-prefetch track', error)
      }
      completed += 1
      onProgress(completed, total)
    }
  }

  const workerCount = Math.min(PREFETCH_ALBUM_CONCURRENCY, todo.length)
  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  )
}

export const prefetch = {
  prefetchNext,
  prefetchAll,
  cancel,
  reset,
}
