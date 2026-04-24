import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Sheet({ open, onOpenChange, children, className }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed top-0 right-0 h-full z-50 bg-zinc-900 border-l border-white/[0.06] shadow-2xl",
              className
            )}
            style={{ width: className?.includes('w-[') ? undefined : '600px' }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between p-6 border-b border-white/[0.06]", className)}
      {...props}
    />
  )
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-bold text-zinc-100", className)}
      {...props}
    />
  )
}

export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-zinc-500", className)}
      {...props}
    />
  )
}

export function SheetContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col h-full overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function SheetClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
    >
      <X size={20} />
    </button>
  )
}
