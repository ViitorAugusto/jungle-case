import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@presentation/lib/utils'
import { Tabs as TabsPrimitive } from 'radix-ui'

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', className)}
      {...props}
    />
  )
}

const tabsListVariants = cva('group/tabs-list inline-flex w-fit items-center', {
  variants: {
    variant: {
      default: 'gap-1 rounded-md bg-surface-card p-1',
      /** Abas do catálogo do Figma: texto com sublinhado de 2 px na ativa. */
      line: 'gap-2.5 md:gap-5',
      /** Abas do detalhe do NFT (Figma): largura total, linha inferior e sublinhado de 3 px na ativa. */
      underline: 'w-full gap-8 border-b border-primary/25',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center whitespace-nowrap text-foreground focus-ring transition-colors hover:text-text-accent disabled:pointer-events-none disabled:opacity-50',
        'group-data-[variant=default]/tabs-list:rounded-sm group-data-[variant=default]/tabs-list:px-3 group-data-[variant=default]/tabs-list:py-1.5 group-data-[variant=default]/tabs-list:text-body-sm group-data-[variant=default]/tabs-list:data-[state=active]:bg-surface-raised group-data-[variant=default]/tabs-list:data-[state=active]:text-text-accent',
        'group-data-[variant=line]/tabs-list:pb-1 group-data-[variant=line]/tabs-list:text-body-sm group-data-[variant=line]/tabs-list:leading-4 md:group-data-[variant=line]/tabs-list:text-body md:group-data-[variant=line]/tabs-list:leading-4 md:group-data-[variant=line]/tabs-list:font-medium',
        'group-data-[variant=underline]/tabs-list:pb-2.5 group-data-[variant=underline]/tabs-list:text-lead-sm group-data-[variant=underline]/tabs-list:leading-4.5',
        'data-[state=active]:font-bold data-[state=active]:text-text-accent md:group-data-[variant=line]/tabs-list:data-[state=active]:font-medium',
        'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-primary after:opacity-0 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        'group-data-[variant=underline]/tabs-list:after:-bottom-px group-data-[variant=underline]/tabs-list:after:h-0.75 group-data-[variant=underline]/tabs-list:data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
