import Hero from "../components/landing/Hero"
import Navbar from "@/pages/components/landing/Navbar"
import Beneficios from "../components/landing/Beneficios"
import CTASection from "../components/landing/CTASection"
import FAQSection from "../components/landing/Faq"
import ComoFunciona from "../components/landing/ComoFunciona"
import Footer from "../components/landing/Footer"
// import ChatbotAtencionClienteCard from "../components/landing/ChatbotAtencionClientesCard"

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Beneficios/>
      {/* <ChatbotAtencionClienteCard/> */}
      <CTASection/>
      <ComoFunciona />
      <FAQSection />
      <Footer/>
      {/* Aquí luego vendrán las otras secciones */}
    </>
  )
}
