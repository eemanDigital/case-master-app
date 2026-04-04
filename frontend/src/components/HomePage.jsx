import "./home/styles/homepage.css";

import {
  Navbar,
  HeroSection,
  LogosSection,
  FeaturesSection,
  StatsSection,
  TestimonialsSection,
  PricingSection,
  CTASection,
  Footer,
} from "./home/sections";

import {
  MatterShowcase,
  TemplatesShowcase,
  CACShowcase,
  CalendarShowcase,
} from "./home/sections/showcase";

export default function HomePage() {
  return (
    <>
      <div className="lm-home">
        <div className="lm-top-stripe" />
        <Navbar />
        <main>
          <HeroSection />
          <LogosSection />
          <FeaturesSection />
          <MatterShowcase />
          <TemplatesShowcase />
          <CACShowcase />
          <CalendarShowcase />
          <StatsSection />
          {/* <TestimonialsSection /> */}
          {/* <PricingSection /> */}
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
}
