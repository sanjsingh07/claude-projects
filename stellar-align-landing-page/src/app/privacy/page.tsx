import React from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stellar-bg text-stellar-fg font-body py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-stellar-muted hover:text-stellar-violet transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <h1 className="text-5xl font-display italic mb-8">Privacy Policy</h1>
        <p className="text-stellar-muted mb-12">Last Updated: May 18, 2026</p>

        <div className="space-y-12 text-stellar-muted leading-relaxed">
          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              To provide personalized astrology insights, we collect your:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Birth date, time, and location (to calculate your natal chart)</li>
              <li>Email address (for account creation and notifications)</li>
              <li>Device information and usage data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">2. How We Use Your Data</h2>
            <p>
              Your birth data is used exclusively to generate your natal chart and daily horoscopes using the Swiss Ephemeris and our AI models. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">3. AI Processing</h2>
            <p>
              Your astrological data is processed by advanced AI models (such as Claude 3.5) to provide personalized readings. This data is anonymized before being sent to AI providers and is not used to train their models.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">4. Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display italic text-stellar-fg mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@stellaralign.com.
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
