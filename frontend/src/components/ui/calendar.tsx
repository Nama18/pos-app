import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(className)}
      classNames={{
        root: "w-fit",
        chevron: "fill-foreground size-3.5",
        months: "flex gap-1",
        month: "flex flex-col gap-0.5",
        month_caption: "flex justify-center pt-1 relative items-center h-8",
        caption_label: "text-xs font-medium",
        nav: "flex items-center gap-1",
        button_previous:
          "absolute left-1 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-muted/40 size-7 bg-transparent p-0",
        button_next:
          "absolute right-1 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-muted/40 size-7 bg-transparent p-0",
        weekday: "text-muted-foreground rounded-lg w-7 text-[11px] font-normal",
        weekdays: "flex",
        week: "flex w-full",
        day: cn(
          "relative p-0 text-center text-xs focus-within:relative focus-within:z-20 inline-flex items-center justify-center rounded-lg size-7 font-normal transition-colors hover:bg-muted/40 aria-selected:opacity-100",
          props.mode === "range"
            ? "group aria-selected:bg-muted aria-selected:text-foreground"
            : "aria-selected:bg-primary aria-selected:text-primary-foreground"
        ),
        day_button: "size-7 p-0 font-normal text-xs",
        range_start:
          "aria-selected:rounded-l-lg aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_end:
          "aria-selected:rounded-r-lg aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_middle:
          "aria-selected:bg-muted aria-selected:text-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-muted/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
