import { ChevronDown } from "lucide-react";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  title?: string;
  items: FAQItem[];
};

export function FAQSection({ title = "Frequently asked questions", items }: FAQSectionProps) {
  if (!items.length) return null;

  return (
    <section className="rounded-[22px] border border-border bg-surface p-5 md:p-6" aria-labelledby="faq-heading">
      <div className="max-w-2xl">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Questions</p>
        <h2 id="faq-heading" className="mt-1.5 font-serif text-[27px] leading-[1.05] tracking-[-0.035em] md:text-[31px]">
          {title}
        </h2>
      </div>
      <div className="mt-5 divide-y divide-border/70 border-y border-border/70">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13.5px] font-medium [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2.5 max-w-3xl pr-8 text-[12.5px] leading-relaxed text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
