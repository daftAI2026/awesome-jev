import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GithubLogo,
  Info,
  List,
  MagnifyingGlass,
  SquaresFour,
} from '@phosphor-icons/react'
import itemsData from '../data/items.json'
import xData from '../data/x.json'
import { AsciiWordmark } from '@/components/AsciiWordmark'
import { GithubList } from '@/components/GithubList'
import { ItemCard } from '@/components/ItemCard'
import { ZoneNav } from '@/components/ZoneNav'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useI18n } from '@/i18n'
import { countByType, countGithubProjects } from '@/lib/counts'
import { searchItems } from '@/lib/search'
import {
  githubStarRanks,
  sortGithubItems,
  sortXItems,
  sortYoutubeItems,
} from '@/lib/sort'
import { cn } from 'cn'
import type {
  DirectoryItem,
  FilterType,
  GithubSort,
  GithubView,
  XSort,
  YoutubeSort,
} from '@/lib/types'

const partModules = import.meta.glob('../data/part-*.json', {
  eager: true,
}) as Record<string, { default: DirectoryItem[] }>
const partItems = Object.keys(partModules)
  .sort()
  .flatMap((key) => partModules[key].default)

const items = [
  ...(itemsData as DirectoryItem[]),
  ...partItems,
  ...(xData as DirectoryItem[]),
]
