import { LyricsSettings } from './lyrics'
import { PrefetchSettings } from './prefetch'
import { ReplayGainConfig } from './replay-gain'

export function Audio() {
  return (
    <div className="space-y-4">
      <ReplayGainConfig />
      <LyricsSettings />
      <PrefetchSettings />
    </div>
  )
}
