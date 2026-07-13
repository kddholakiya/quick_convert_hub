"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Command<Item, Multiple extends boolean | undefined = false>({
  ...props
}: ComboboxPrimitive.Root.Props<Item, Multiple>) {
  return <ComboboxPrimitive.Root data-slot="command" {...props} />
}

function CommandInputGroup({
  className,
  children,
  ...props
}: ComboboxPrimitive.InputGroup.Props) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="command-input-group"
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/60 px-2.5 py-1.5 focus-within:border-zinc-500 has-[button]:px-1.5",
        className
      )}
      {...props}
    >
      {children}
    </ComboboxPrimitive.InputGroup>
  )
}

function CommandInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="command-input"
      className={cn(
        "h-7 min-w-16 flex-1 border-0 bg-transparent p-0 text-sm text-zinc-100 outline-none placeholder:text-zinc-600",
        className
      )}
      {...props}
    />
  )
}

function CommandChips({ className, ...props }: ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="command-chips"
      className={cn("flex w-full flex-wrap items-center gap-1", className)}
      {...props}
    />
  )
}

function CommandChip({ className, children, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="command-chip"
      className={cn(
        "group flex h-6 items-center gap-1 rounded-md bg-zinc-800 pl-2 pr-1 text-xs font-medium text-zinc-200 outline-none data-highlighted:bg-zinc-700",
        className
      )}
      {...props}
    >
      {children}
    </ComboboxPrimitive.Chip>
  )
}

function CommandChipRemove({
  className,
  ...props
}: ComboboxPrimitive.ChipRemove.Props) {
  return (
    <ComboboxPrimitive.ChipRemove
      data-slot="command-chip-remove"
      className={cn(
        "flex h-4 w-4 items-center justify-center rounded-sm text-zinc-400 hover:bg-zinc-600 hover:text-zinc-100",
        className
      )}
      {...props}
    />
  )
}

function CommandPortal({ ...props }: ComboboxPrimitive.Portal.Props) {
  return <ComboboxPrimitive.Portal {...props} />
}

function CommandPositioner({
  className,
  sideOffset = 6,
  ...props
}: ComboboxPrimitive.Positioner.Props) {
  return (
    <ComboboxPrimitive.Positioner
      data-slot="command-positioner"
      className={cn("z-50 outline-none", className)}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function CommandPopup({ className, children, ...props }: ComboboxPrimitive.Popup.Props) {
  return (
    <ComboboxPrimitive.Popup
      data-slot="command-popup"
      className={cn(
        "w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/40 transition-[transform,opacity] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </ComboboxPrimitive.Popup>
  )
}

function CommandList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain p-1.5",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-xs text-zinc-500", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  accentClassName,
  ...props
}: ComboboxPrimitive.Item.Props & { accentClassName?: string }) {
  return (
    <ComboboxPrimitive.Item
      data-slot="command-item"
      className={cn(
        "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-lg p-2 text-sm leading-4 text-zinc-300 outline-none select-none data-highlighted:bg-zinc-800 data-highlighted:text-zinc-50",
        className
      )}
      {...props}
    >
      <ComboboxPrimitive.ItemIndicator className={cn("col-start-1 text-emerald-400", accentClassName)}>
        <CheckIcon className="h-3.5 w-3.5" />
      </ComboboxPrimitive.ItemIndicator>
      <span className="col-start-2 truncate">{children}</span>
    </ComboboxPrimitive.Item>
  )
}

export {
  Command,
  CommandInputGroup,
  CommandInput,
  CommandChips,
  CommandChip,
  CommandChipRemove,
  CommandPortal,
  CommandPositioner,
  CommandPopup,
  CommandList,
  CommandEmpty,
  CommandItem,
}
