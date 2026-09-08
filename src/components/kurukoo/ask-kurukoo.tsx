import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AskKurukooProps = {
  prompt: string;
  children?: React.ReactNode;
  className?: string;
};

export function AskKurukoo({ prompt, children = "Ask Kurukoo", className }: AskKurukooProps) {
  return (
    <Link
      to="/chat"
      search={{ query: prompt } as never}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-medium transition-colors hover:bg-elevated",
        className,
      )}
    >
      <MessageCircle className="size-3.5" />
      {children}
    </Link>
  );
}
