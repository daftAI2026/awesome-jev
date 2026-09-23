import { Menu } from '@base-ui/react/menu'
import { Check } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface HeaderChoiceMenuProps {
  label: string
  icon: ReactNode
  value: string
  options: readonly { value: string; label: string }[]
  onValueChange: (value: string) => void
}

export function HeaderChoiceMenu({ label, icon, value, options, onValueChange }: HeaderChoiceMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        render={<Button type="button" variant="ghost" size="icon-sm" className="size-9 text-muted-foreground" />}
        aria-label={label}
        title={label}
      >
        {icon}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-[60]">
          <Menu.Popup className="min-w-36 rounded-lg border border-border bg-popover p-1 text-popover-foreground outline-none">
            <Menu.RadioGroup value={value} onValueChange={(next) => {
              if (typeof next === 'string') onValueChange(next)
            }}>
              {options.map((option) => (
                <Menu.RadioItem key={option.value} value={option.value} closeOnClick className="flex min-h-9 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-none hover:bg-muted focus:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                  {option.label}
                  <Menu.RadioItemIndicator className="ml-auto flex size-4 items-center justify-center">
                    <Check className="size-4" aria-hidden />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
