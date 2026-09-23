import { Menu } from '@base-ui/react/menu'
import { Check, Globe } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

export function LanguageMenu() {
  const { locale, setLocale, t } = useI18n()

  return (
    <Menu.Root>
      <Menu.Trigger
        render={<Button type="button" variant="ghost" size="icon-sm" className="size-9 text-muted-foreground" />}
        aria-label={t('languageLabel')}
        title={t('languageLabel')}
      >
        <Globe className="size-4" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-[60]">
          <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-popover-foreground outline-none">
            <Menu.RadioGroup value={locale} onValueChange={(next) => {
              if (next === 'en' || next === 'zh') setLocale(next)
            }}>
              <Menu.RadioItem value="en" closeOnClick className="flex min-h-9 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-none hover:bg-muted focus:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                English
                <Menu.RadioItemIndicator className="ml-auto flex size-4 items-center justify-center">
                  <Check className="size-4" aria-hidden />
                </Menu.RadioItemIndicator>
              </Menu.RadioItem>
              <Menu.RadioItem value="zh" closeOnClick className="flex min-h-9 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-none hover:bg-muted focus:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                简体中文
                <Menu.RadioItemIndicator className="ml-auto flex size-4 items-center justify-center">
                  <Check className="size-4" aria-hidden />
                </Menu.RadioItemIndicator>
              </Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
