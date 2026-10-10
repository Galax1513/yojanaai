import { Routes, Route, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { HomePage } from "@/pages/HomePage"
import { HowItWorksPage } from "@/pages/HowItWorksPage"
import { DiscoverPage } from "@/pages/DiscoverPage"
import { OnboardingPage } from "@/pages/OnboardingPage"
import { ResultsPage } from "@/pages/ResultsPage"
import { SchemeDetailPage } from "@/pages/SchemeDetailPage"
import { LoginPage } from "@/pages/LoginPage"
import { PrivacyPage } from "@/pages/PrivacyPage"
import { TermsPage } from "@/pages/TermsPage"
import { RequireAuth } from "@/components/auth/RequireAuth"

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // "instant" overrides the global `scroll-behavior: smooth` in
    // index.css, so a new page opens at the top rather than visibly
    // scrolling up from wherever the previous page was (e.g. a footer
    // link). In-page anchor links keep the smooth behaviour.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [pathname])
  return null
}

function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/login" element={<LoginPage key="login" mode="login" />} />
          <Route path="/signup" element={<LoginPage key="signup" mode="signup" />} />
          <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
          <Route path="/results" element={<RequireAuth><ResultsPage /></RequireAuth>} />
          <Route path="/scheme/:id" element={<SchemeDetailPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
