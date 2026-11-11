import { ContactProvider } from "@/components/site/ContactContext";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Advantages } from "@/components/site/Advantages";
import { VideoSection } from "@/components/site/VideoSection";
import { Clients } from "@/components/site/Clients";
import { PracticeCarousel } from "@/components/site/PracticeCarousel";
import { Quiz } from "@/components/site/Quiz";
import { AnalysisEntry } from "@/components/site/AnalysisEntry";
import { Calculator } from "@/components/site/Calculator";
import { Faq } from "@/components/site/Faq";
import { ContactSection } from "@/components/site/ContactSection";
import { BackToTop, Footer } from "@/components/site/Footer";

export function Landing() {
  return (
    <ContactProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Перейти к содержимому
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Advantages />
        <VideoSection />
        <Clients />
        <PracticeCarousel />
        <Quiz />
        <AnalysisEntry />
        <Calculator />
        <Faq />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
    </ContactProvider>
  );
}
