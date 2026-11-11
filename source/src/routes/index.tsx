import { createFileRoute } from "@tanstack/react-router";
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

const TITLE = "Алексеева Людмила — финансовый консультант | FINCONSULT";
const DESCRIPTION =
  "Алексеева Людмила — финансовый консультант для собственников бизнеса и топ-менеджеров. Финансовая стратегия, управленческий учёт и защита капитала.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
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
