import React from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stellar-bg text-stellar-fg font-body py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-stellar-muted hover:text-stellar-violet transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <h1 className="text-5xl font-display italic mb-8">Terms of Service</h1>
        <p className="text-stellar-muted mb-12">Last Updated: May 18, 2026</p>

        <div className="space-y-12 text-stellar-muted leading-relaxed">
          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Stellar Align, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">2. Description of Service</h2>
            <p>
              Stellar Align provides personalized astrology content, natal chart analysis, and compatibility reports generated through astronomical calculations and AI interpretation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">3. Not Professional Advice</h2>
            <p>
              The content provided by Stellar Align is for entertainment and informational purposes only. It is not intended to be a substitute for professional medical, legal, financial, or psychological advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">4. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">5. Intellectual Property</h2>
            <p>
              All content, logos, and software used in Stellar Align are the property of Stellar Align or its licensors and are protected by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">6. Limitation of Liability</h2>
            <p>
              Stellar Align shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.
            </p>
          </section>
        </div>

        <div className="mt-24 pt-12 border-t border-stellar-border text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="text-stellar-violet w-4 h-4 fill-current" />
            <span className="font-display text-xl italic uppercase tracking-wider">Stellar Align</span>
          </div>
          <p className="text-xs text-stellar-muted uppercase tracking-widest">Precision Astrology for the Modern Age</p>
        </div>
      </div>
    </div>
  );
}
