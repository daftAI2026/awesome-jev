import bannerSrc from '../../scripts/awesome-jev-banner.txt?raw'

const banner = bannerSrc
  .split('\n')
  .filter((ln) => ln.trim().length > 0)
  .join('\n')

export function AsciiWordmark() {
  return (
    <div className="ascii-wordmark min-w-0 w-full">
      <pre
        aria-hidden="true"
        className="overflow-hidden font-mono leading-tight tracking-tight whitespace-pre text-foreground select-none"
      >
        {banner}
      </pre>
    </div>
  )
}
