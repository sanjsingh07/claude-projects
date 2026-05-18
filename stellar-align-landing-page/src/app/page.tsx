import React from "react";
import Link from "next/link";
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Users, 
  ArrowRight, 
  Compass, 
  Star,
  Zap,
  LayoutGrid
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stellar-bg text-stellar-fg font-body">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stellar-bg/80 backdrop-blur-md border-b border-stellar-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stellar-violet flex items-center justify-center">
              <Star className="text-stellar-bg w-5 h-5 fill-current" />
            </div>
            <span className="font-display text-2xl italic uppercase tracking-wider">Stellar Align</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-stellar-muted hover:text-stellar-fg transition-colors">Features</Link>
            <Link href="#ai" className="text-stellar-muted hover:text-stellar-fg transition-colors">AI Insights</Link>
            <Link href="#compatibility" className="text-stellar-muted hover:text-stellar-fg transition-colors">Compatibility</Link>
          </div>

          <button className="bg-stellar-violet hover:bg-stellar-violet/90 text-stellar-bg font-semibold py-2 px-6 rounded-full transition-all">
            Get Started
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-40 pb-24 px-6 relative overflow-hidden text-center">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-stellar-violet/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stellar-surface border border-stellar-border mb-8">
              <Sparkles className="w-4 h-4 text-stellar-amber" />
              <span className="text-xs font-semibold uppercase tracking-widest text-stellar-amber">Precision Astrology for the Modern Age</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-display italic leading-tight mb-8">
              Your Destiny, <br />
              <span className="bg-gradient-to-r from-stellar-violet via-stellar-pink to-stellar-amber bg-clip-text text-transparent">Perfectly Aligned</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-stellar-muted max-w-2xl mx-auto mb-12 leading-relaxed">
              Experience the convergence of ancient wisdom and modern AI. Get personalized horoscopes, deep natal analysis, and real-time transit tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto bg-stellar-fg text-stellar-bg py-4 px-10 rounded-full font-bold text-lg hover:bg-stellar-violet hover:text-stellar-bg transition-all flex items-center justify-center gap-2 group">
                Download for iOS
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto bg-stellar-surface border border-stellar-border text-stellar-fg py-4 px-10 rounded-full font-bold text-lg hover:bg-stellar-border transition-all">
                Download for Android
              </button>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Horoscopes */}
            <div className="md:col-span-2 bg-stellar-surface border border-stellar-border rounded-[32px] p-10 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-stellar-violet/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-stellar-violet/20 flex items-center justify-center mb-6">
                  <Zap className="text-stellar-violet w-6 h-6" />
                </div>
                <h3 className="text-3xl font-display italic mb-4">AI-Generated Daily Horoscopes</h3>
                <p className="text-stellar-muted text-lg leading-relaxed max-w-md">
                  We don't do generic "Sun sign" readings. Our system synthesizes your entire natal chart with real-time planetary transits using state-of-the-art LLMs.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-stellar-bg/50 border border-stellar-border rounded-full text-[10px] uppercase tracking-widest text-stellar-violet">Personal Transits</span>
                  <span className="px-3 py-1 bg-stellar-bg/50 border border-stellar-border rounded-full text-[10px] uppercase tracking-widest text-stellar-pink">Moon Phases</span>
                  <span className="px-3 py-1 bg-stellar-bg/50 border border-stellar-border rounded-full text-[10px] uppercase tracking-widest text-stellar-amber">Vedic Depth</span>
                </div>
              </div>
              <Link href="#how-it-works" className="mt-12 flex items-center gap-2 text-stellar-violet font-semibold uppercase tracking-widest text-xs group-hover:gap-4 transition-all cursor-pointer">
                How it works <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Natal Chart */}
            <div className="bg-stellar-surface border border-stellar-border rounded-[32px] p-10 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-stellar-pink/20 flex items-center justify-center mb-6">
                  <Compass className="text-stellar-pink w-6 h-6" />
                </div>
                <h3 className="text-3xl font-display italic mb-4">Deep Natal Analysis</h3>
                <p className="text-stellar-muted text-lg leading-relaxed">
                  Precise calculations using Swiss Ephemeris for unmatched accuracy.
                </p>
              </div>
              <div className="mt-8 flex justify-center">
                <div className="w-40 h-40 border-2 border-stellar-border rounded-full relative flex items-center justify-center">
                  <div className="absolute inset-0 border border-stellar-border rounded-full rotate-45 scale-75" />
                  <div className="w-4 h-4 bg-stellar-pink rounded-full shadow-[0_0_20px_rgba(255,141,161,0.5)]" />
                </div>
              </div>
            </div>

            {/* Compatibility */}
            <div className="bg-stellar-surface border border-stellar-border rounded-[32px] p-10 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-stellar-amber/20 flex items-center justify-center mb-6">
                  <Users className="text-stellar-amber w-6 h-6" />
                </div>
                <h3 className="text-3xl font-display italic mb-4">Cosmic Matching</h3>
                <p className="text-stellar-muted text-lg leading-relaxed">
                  Connect with friends and explore deep synastry and compatibility scores.
                </p>
              </div>
              <div className="mt-12 flex -space-x-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-stellar-bg bg-stellar-border flex items-center justify-center text-xs font-bold">
                    User {i}
                  </div>
                ))}
              </div>
            </div>

            {/* Transit Tracking */}
            <div className="md:col-span-2 bg-stellar-surface border border-stellar-border rounded-[32px] p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-stellar-amber/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/4" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-stellar-violet/20 flex items-center justify-center mb-6">
                  <LayoutGrid className="text-stellar-violet w-6 h-6" />
                </div>
                <h3 className="text-3xl font-display italic mb-4">Real-time Transit Tracking</h3>
                <p className="text-stellar-muted text-lg leading-relaxed max-w-md">
                  Watch the planets move in real-time. Understand how current celestial events are impacting your emotional landscape and life path.
                </p>
              </div>
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Moon', 'Mars', 'Venus', 'Saturn'].map((planet) => (
                  <div key={planet} className="bg-stellar-bg/50 border border-stellar-border rounded-2xl p-4 flex flex-col items-center gap-2">
                    <span className="text-xs text-stellar-muted uppercase tracking-widest">{planet}</span>
                    <span className="text-sm font-bold">24° Leo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section id="ai" className="py-24 px-6 bg-stellar-surface border-y border-stellar-border">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-block px-4 py-1.5 rounded-full bg-stellar-violet/10 border border-stellar-violet/20 text-stellar-violet text-xs font-bold uppercase tracking-widest mb-8">
                Powered by Advanced AI
              </div>
              <h2 className="text-5xl md:text-6xl font-display italic mb-8 leading-tight">
                Astrology that <br />
                <span className="text-stellar-pink">Understands You</span>
              </h2>
              <p className="text-xl text-stellar-muted leading-relaxed mb-8">
                Most horoscopes are generic. Stellar Align is different. Our AI engines (Claude 3.5 & Qwen) process your entire birth chart—not just your Sun sign—to deliver advice that feels eerily accurate and deeply personal.
              </p>
              <ul className="space-y-4">
                {[
                  "Context-aware emotional insights",
                  "Actionable advice for work and love",
                  "Personalized ritual suggestions",
                  "Dynamic interpretation of complex aspects"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-stellar-fg">
                    <div className="w-5 h-5 rounded-full bg-stellar-violet/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-stellar-violet" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
              <div className="w-full aspect-square max-w-md mx-auto bg-stellar-bg rounded-[40px] border border-stellar-border p-8 relative shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                  <Sparkles className="text-stellar-violet w-8 h-8 opacity-50" />
                </div>
                <div className="space-y-6">
                  <div className="w-12 h-1 flex bg-stellar-violet rounded-full" />
                  <h4 className="text-2xl font-display italic">Today's Reflection</h4>
                  <div className="space-y-4">
                    <div className="h-4 bg-stellar-surface rounded-full w-full" />
                    <div className="h-4 bg-stellar-surface rounded-full w-[90%]" />
                    <div className="h-4 bg-stellar-surface rounded-full w-[95%]" />
                    <div className="h-4 bg-stellar-surface rounded-full w-[80%]" />
                    <div className="h-4 bg-stellar-surface rounded-full w-[60%] opacity-50" />
                  </div>
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="p-4 bg-stellar-violet/10 border border-stellar-violet/20 rounded-2xl">
                    <p className="text-xs text-stellar-violet italic">"The Mercury-Jupiter square today suggests it's time to speak your truth, even if your voice shakes."</p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-stellar-pink/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-stellar-amber/20 rounded-full blur-[80px]" />
            </div>
          </div>
        </section>

        {/* How it Works / Architecture Section */}
        <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display italic mb-4">The Architecture of Accuracy</h2>
            <p className="text-stellar-muted text-lg max-w-2xl mx-auto">
              How we transform trillions of celestial data points into your daily guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-stellar-surface border border-stellar-border rounded-3xl relative">
              <div className="absolute top-0 right-0 p-4 font-display italic text-4xl text-stellar-border">01</div>
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-stellar-violet" />
                Precision Calculation
              </h4>
              <p className="text-stellar-muted leading-relaxed">
                Our backend utilizes the <strong>Swiss Ephemeris</strong> library, the industry standard for sub-degree planetary precision. We calculate your exact natal placements across both Tropical and Sidereal systems.
              </p>
            </div>

            <div className="p-8 bg-stellar-surface border border-stellar-border rounded-3xl relative">
              <div className="absolute top-0 right-0 p-4 font-display italic text-4xl text-stellar-border">02</div>
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-stellar-pink" />
                Context Mapping
              </h4>
              <p className="text-stellar-muted leading-relaxed">
                We don't just look at signs. We map <strong>Transit-to-Natal aspects</strong>, planetary ingresses, and Vedic metrics like Nakshatras and Divisional charts (D1, D9) to build a multi-layered profile of your current energy.
              </p>
            </div>

            <div className="p-8 bg-stellar-surface border border-stellar-border rounded-3xl relative">
              <div className="absolute top-0 right-0 p-4 font-display italic text-4xl text-stellar-border">03</div>
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-stellar-amber" />
                AI Synthesis
              </h4>
              <p className="text-stellar-muted leading-relaxed">
                State-of-the-art LLMs (Claude 3.5 Sonnet & Qwen) synthesize this massive dataset into a <strong>"psychological editorial"</strong> style reading. No robotic templates—just fluid, human-like insight.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-display italic mb-8">Ready to Align?</h2>
            <p className="text-xl text-stellar-muted mb-12 max-w-2xl mx-auto">
              Join thousands of others who are navigating life with cosmic clarity. Download Stellar Align today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="w-full sm:w-auto bg-stellar-violet text-stellar-bg py-5 px-12 rounded-full font-bold text-xl hover:scale-105 transition-transform">
                Get the App
              </button>
              <button className="w-full sm:w-auto bg-stellar-bg border border-stellar-border text-stellar-fg py-5 px-12 rounded-full font-bold text-xl hover:bg-stellar-surface transition-colors">
                View Demo
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-stellar-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-stellar-violet flex items-center justify-center">
              <Star className="text-stellar-bg w-3 h-3 fill-current" />
            </div>
            <span className="font-display text-xl italic uppercase tracking-wider">Stellar Align</span>
          </div>
          
          <div className="flex gap-8 text-sm text-stellar-muted">
            <Link href="/privacy" className="hover:text-stellar-fg transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-stellar-fg transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-stellar-fg transition-colors">Contact</Link>
          </div>
          
          <div className="text-xs text-stellar-muted font-mono uppercase tracking-widest">
            © 2026 Stellar Align. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
