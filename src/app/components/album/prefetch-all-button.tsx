import { CloudDownload, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { getSongStreamUrl } from '@/api/httpClient'
import { Actions } from '@/app/components/actions'
import { ISong } from '@/types/responses/song'
import { prefetch } from '@/utils/prefetch'

interface PrefetchAllButtonProps {
  songs: ISong[]
}

interface State {
  running: boolean
  completed: number
  total: number
}

export function PrefetchAllButton({ songs }: PrefetchAllButtonProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<State>({
    running: false,
    completed: 0,
    total: songs.length,
  })
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  const tooltip = state.running
    ? t('album.buttons.prefetchingAll', {
        completed: state.completed,
        total: state.total,
      })
    : t('album.buttons.prefetchAll')

  async function handleClick() {
    if (state.running) {
      controllerRef.current?.abort()
      return
    }

    const items = songs.map((song) => ({
      id: song.id,
      streamUrl: getSongStreamUrl(song.id),
    }))
    if (items.length === 0) return

    const controller = new AbortController()
    controllerRef.current = controller
    setState({ running: true, completed: 0, total: items.length })

    try {
      await prefetch.prefetchAll(items, {
        signal: controller.signal,
        onProgress: (completed, total) =>
          setState({ running: true, completed, total }),
      })
      if (!controller.signal.aborted) {
        toast.success(t('album.toasts.prefetchComplete'))
      } else {
        toast.info(t('album.toasts.prefetchCancelled'))
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
      setState((prev) => ({ ...prev, running: false }))
    }
  }

  return (
    <Actions.Button tooltip={tooltip} onClick={handleClick}>
      {state.running ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <CloudDownload
          className="w-5 h-5 drop-shadow-md"
          strokeWidth={2}
        />
      )}
    </Actions.Button>
  )
}
