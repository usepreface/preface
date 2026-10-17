import type * as React from "react";

import { buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon, CheckCircleIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { site } from "../../../site";
import { Section } from "../components/section";
import { SectionHeading } from "../components/section-heading";

/* Figma "Pricing": three plans, the middle one highlighted. */

const plans = [
  {
    name: "Community",
    price: "Free forever",
    description: "Apache-2.0 licensed. Every connector, channel, SSO and SCIM.",
    features: ["Unlimited users and sources", "Community support on GitHub", "Docker & Helm"],
    cta: "Install now",
    href: "#get-started",
    featured: false,
  },
  {
    name: "Support",
    price: "Talk to us",
    description: "For teams who want a response time and a named engineer.",
    features: ["Everything in Community", "Private Slack channel", "Upgrade assistance"],
    cta: "Contact sales",
    href: site.contact,
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    description: "Air-gapped, regulated and very large deployments.",
    features: ["Everything in Support", "Security reviews & SLAs", "Custom connectors"],
    cta: "Book a demo",
    href: site.contact,
    featured: false,
  },
] as const;

export function Pricing() {
  return (
    <Section id="pricing" aria-labelledby="pricing-title" inner="items-center gap-12">
      <SectionHeading
        id="pricing-title"
        align="center"
        eyebrow="Pricing"
        title="Free to run. Paid when you want a hand."
        description="Every feature ships in the open-source build. Support plans add people, not features."
      />
      <ul className="grid w-full items-start gap-4 md:grid-cols-3">
        {plans.map((plan, i) => (
          <li
            key={plan.name}
            data-reveal=""
            style={{ "--delay": `${i * 90}ms` } as React.CSSProperties}
            className={cn(
              "relative flex flex-col gap-4.5 rounded-3xl border p-5 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 md:p-8",
              plan.featured
                ? "border-(--landing-highlight-border) bg-(--landing-highlight) hover:shadow-[0_24px_60px_rgb(47_107_255/0.18)]"
                : "border-(--landing-card-border) bg-(--landing-card) hover:shadow-[0_24px_60px_rgb(23_71_201/0.08)]",
            )}
          >
            {/* Phones: a compact row that links to the plan's action. */}
            <a href={plan.href} className="flex items-center gap-3 outline-none md:hidden">
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-base font-medium text-foreground">{plan.name}</span>
                <span className="text-13 text-fg-secondary">{plan.price}</span>
              </span>
              <ArrowRightIcon size={18} className="text-icon-secondary" />
              <span className="absolute inset-0 rounded-3xl" aria-hidden="true" />
            </a>
            <h3 className="text-heading-4 text-foreground max-md:hidden">{plan.name}</h3>
            <p className="font-display text-[2.5rem] leading-11 font-medium tracking-[-0.02em] text-foreground max-md:hidden">
              {plan.price}
            </p>
            <p className="text-sm text-fg-secondary max-md:hidden">{plan.description}</p>
            <ul className="flex flex-col gap-3.5 py-1 max-md:hidden">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground">
                  <CheckCircleIcon size={18} className="shrink-0 text-fg-accent" />
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={plan.href}
              className={cn(
                buttonVariants({ variant: plan.featured ? "default" : "outline", size: "lg" }),
                "w-full justify-start max-md:hidden",
              )}
            >
              {plan.cta}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
