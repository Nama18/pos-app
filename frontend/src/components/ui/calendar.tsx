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
      className={cn("p-3", className)}
      classNames={{
        root: "w-full",
        chevron: "fill-foreground",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors hover:bg-muted/40 h-7 w-7 bg-transparent p-0"
        ),
        button_next: cn(
          "absolute right-1 inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors hover:bg-muted/40 h-7 w-7 bg-transparent p-0"
        ),
        weekday: "text-muted-foreground rounded-lg w-8 font-normal text-[0.8rem]",
        weekdays: "flex",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 inline-flex items-center justify-center rounded-lg h-8 w-8 p-0 font-normal transition-colors hover:bg-muted/40 aria-selected:opacity-100",
          props.mode === "range"
            ? "group aria-selected:bg-muted aria-selected:text-foreground"
            : "aria-selected:bg-primary aria-selected:text-primary-foreground"
        ),
        day_button: cn(
          "h-8 w-8 p-0 font-normal"
        ),
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
