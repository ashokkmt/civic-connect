import {
  ClipboardCheck,
  ShieldCheck,
  Construction,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    title: "Report Issue",
    description: "User reports an issue with description, location, and images.",
    Icon: ClipboardCheck,
  },
  {
    title: "Authority Approval",
    description: "The relevant department reviews and approves the issue.",
    Icon: ShieldCheck,
  },
  {
    title: "Work In Progress",
    description: "Assigned worker begins resolving the issue.",
    Icon: Construction,
  },
  {
    title: "Issue Resolved",
    description: "The issue is marked resolved and visible to the public.",
    Icon: CheckCircle2,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[var(--background)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-300">
            How CivicConnect Works
          </span>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            A clear, transparent issue lifecycle
          </h2>
        </div>

        <div className="relative mt-12">
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--border)]" />
          <div className="space-y-10">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div key={step.title} className="grid items-center md:grid-cols-[1fr_auto_1fr]">
                  <div className={isLeft ? "pr-8 text-right" : "order-3 pl-8 text-left"}>
                    <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                      Step {index + 1}
                    </span>
                    <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {step.description}
                    </p>
                  </div>
                  <div className="order-2 flex items-center justify-center">
                    <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-[var(--surface)] text-emerald-600 shadow-sm dark:bg-[var(--surface)] dark:text-emerald-300">
                      <step.Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className={isLeft ? "order-3" : "order-1"} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
