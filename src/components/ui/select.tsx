"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"

function Select({
  value,
  onValueChange,
  children,
  defaultValue,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  defaultValue?: string
}) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
    >
      {children}
    </SelectPrimitive.Root>
  )
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-xl border-2 border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-black text-white shadow-[0_2px_0_0_#09090b] transition-all",
        "placeholder:text-zinc-500",
        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>span]:line-clamp-1 uppercase tracking-wider",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 text-zinc-500" />
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({
  className,
  placeholder,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value> & {
  placeholder?: string
}) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      placeholder={placeholder}
      className={cn("text-sm", className)}
      {...props}
    />
  )
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Popup>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Popup
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border-2 border-zinc-800 bg-zinc-900 text-white shadow-[0_8px_0_0_#09090b]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        <div className="p-1.5">
          {children}
        </div>
      </SelectPrimitive.Popup>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-9 pr-3 text-sm font-bold text-zinc-400 outline-none transition-colors uppercase tracking-tight",
        "hover:bg-zinc-800 hover:text-white",
        "focus:bg-zinc-800 focus:text-white",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectGroup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("p-1", className)}
      {...props}
    >
      {children}
    </SelectPrimitive.Group>
  )
}

function SelectLabel({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn(
        "px-3 py-2 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      className={cn("-mx-1 my-1.5 h-0.5 bg-zinc-800", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
