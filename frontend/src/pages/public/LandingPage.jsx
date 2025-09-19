// RUTA: src/pages/LandingPage.jsx

import Hero from "../components/landing/Hero";
import Navbar from "../components/landing/Navbar";
import ComoFunciona from "../components/landing/ComoFunciona";
import CTASection from "../components/landing/CTASection";
import FAQSection from "../components/landing/Faq";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
    return (
        <>
            <Navbar />
            <Hero />
            <ComoFunciona />
            <CTASection />
            <FAQSection />
            <Footer />
        </>
    );
}