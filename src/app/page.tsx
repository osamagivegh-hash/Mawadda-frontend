import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { WhyUsSection } from "@/components/WhyUsSection";
import { JourneySection } from "@/components/JourneySection";
import { ConsultantsSection } from "@/components/ConsultantsSection";
import { CallToActionSection } from "@/components/CallToActionSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <WhyUsSection />
        <JourneySection />
        <ConsultantsSection />
        <CallToActionSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
