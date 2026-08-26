import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import HowItWorksSection from '@/app/components/HowItWorksSection';
import CalculatorSection from '@/app/components/CalculatorSection';
import DigitalTwinWizard from '@/app/components/DigitalTwinWizard';
import GrainOverlay from '@/app/components/GrainOverlay';
import MouseGlow from '@/app/components/MouseGlow';
import ScrollAnimations from '@/app/components/ScrollAnimations';

export default function HomePage() {
  return (
    <>
      <GrainOverlay />
      <MouseGlow />
      <ScrollAnimations />
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <DigitalTwinWizard />
        <CalculatorSection />
      </main>
      <Footer />
    </>
  );
}
