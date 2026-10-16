import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const typographyVariants = cva("text-foreground", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-balance leading-[1.2]",
      h2: "scroll-m-20 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl first:mt-0 text-balance leading-tight",
      h3: "scroll-m-20 text-xl font-semibold tracking-tight sm:text-2xl leading-snug",
      h4: "scroll-m-20 text-lg font-semibold tracking-tight leading-snug",
      p: "leading-relaxed [&:not(:first-child)]:mt-4 text-base",
      lead: "text-lg sm:text-xl text-muted-foreground leading-relaxed font-normal text-balance",
      muted: "text-sm text-muted-foreground leading-normal",
      blockquote:
        "mt-6 border-l-2 border-primary pl-6 italic text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

type ElementTag =
  "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "blockquote" | "span" | "div";

const defaultElementMap: Record<
  NonNullable<VariantProps<typeof typographyVariants>["variant"]>,
  ElementTag
> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  p: "p",
  lead: "p",
  muted: "p",
  blockquote: "blockquote",
};

export interface TypographyProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: ElementTag;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = "p", as, children, ...props }, ref) => {
    // Determine target HTML element
    const Component = (as ||
      defaultElementMap[variant ?? "p"] ||
      "p") as React.ElementType;

    return (
      <Component
        ref={ref}
        className={cn(typographyVariants({ variant, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Typography.displayName = "Typography";
