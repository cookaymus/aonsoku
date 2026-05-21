import { useTranslation } from 'react-i18next'
import {
  Content,
  ContentItem,
  ContentItemForm,
  ContentItemTitle,
  ContentSeparator,
  Header,
  HeaderDescription,
  HeaderTitle,
  Root,
} from '@/app/components/settings/section'
import { Switch } from '@/app/components/ui/switch'
import { useAppPrefetchNextTrack } from '@/store/app.store'

export function PrefetchSettings() {
  const { t } = useTranslation()
  const { prefetchNextTrackEnabled, setPrefetchNextTrackEnabled } =
    useAppPrefetchNextTrack()

  return (
    <Root>
      <Header>
        <HeaderTitle>{t('settings.audio.prefetch.group')}</HeaderTitle>
        <HeaderDescription>
          {t('settings.audio.prefetch.description')}
        </HeaderDescription>
      </Header>
      <Content>
        <ContentItem>
          <ContentItemTitle info={t('settings.audio.prefetch.enabled.info')}>
            {t('settings.audio.prefetch.enabled.label')}
          </ContentItemTitle>
          <ContentItemForm>
            <Switch
              checked={prefetchNextTrackEnabled}
              onCheckedChange={setPrefetchNextTrackEnabled}
            />
          </ContentItemForm>
        </ContentItem>
      </Content>
      <ContentSeparator />
    </Root>
  )
}
