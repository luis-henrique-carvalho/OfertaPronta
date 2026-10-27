import { createFileRoute } from "@tanstack/react-router";
import { LandingHeader } from "@/components/shared/landing-header";
import { LandingHeroSection } from "@/components/shared/landing-hero-section";
import { LandingSegmentsSection } from "@/components/shared/landing-segments-section";
import { LandingFormatsSection } from "@/components/shared/landing-formats-section";
import { LandingStepsSection } from "@/components/shared/landing-steps-section";
import { LandingPricingSection } from "@/components/shared/landing-pricing-section";
import { LandingFooter } from "@/components/shared/landing-footer";

export const Route = createFileRoute("/")({
  component: LandingPageComponent,
});

function LandingPageComponent() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground overflow-x-hidden">
      <LandingHeader />

      <main className="flex-1">
        <LandingHeroSection />
        <LandingSegmentsSection />
        <LandingFormatsSection />
        <LandingStepsSection />
        <LandingPricingSection />
      </main>

      <LandingFooter />
    </div>
  );
}
