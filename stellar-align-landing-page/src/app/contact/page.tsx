import React from "react";
import Link from "next/link";
import { ArrowLeft, Star, Mail, MessageSquare, Globe } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-stellar-bg text-stellar-fg font-body py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-stellar-muted hover:text-stellar-violet transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <h1 className="text-5xl font-display italic mb-8">Get in Touch</h1>
        <p className="text-xl text-stellar-muted mb-12 leading-relaxed">
          Have questions about your chart? Want to report a bug? Or just want to say hello? We'd love to hear from you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 bg-stellar-surface border border-stellar-border rounded-3xl">
            <Mail className="text-stellar-violet w-8 h-8 mb-6" />
            <h3 className="text-xl font-display italic mb-2">Email Us</h3>
            <p className="text-stellar-muted mb-4 text-sm">For general inquiries and support.</p>
            <a href="mailto:hello@stellaralign.com" className="text-stellar-violet hover:underline font-bold">hello@stellaralign.com</a>
          </div>

          <div className="p-8 bg-stellar-surface border border-stellar-border rounded-3xl">
            <MessageSquare className="text-stellar-pink w-8 h-8 mb-6" />
            <h3 className="text-xl font-display italic mb-2">Social</h3>
            <p className="text-stellar-muted mb-4 text-sm">Follow us for cosmic updates.</p>
            <div className="flex gap-4">
              <Link href="#" className="text-stellar-pink hover:underline font-bold">Instagram</Link>
              <Link href="#" className="text-stellar-pink hover:underline font-bold">Twitter</Link>
            </div>
          </div>
        </div>

        <div className="bg-stellar-surface border border-stellar-border rounded-[32px] p-10">
          <h2 className="text-3xl font-display italic mb-8">Send a Message</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stellar-muted font-bold">Name</label>
                <input type="text" className="w-full bg-stellar-bg border border-stellar-border rounded-xl px-4 py-3 focus:outline-none focus:border-stellar-violet transition-colors" placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-stellar-muted font-bold">Email</label>
                <input type="email" className="w-full bg-stellar-bg border border-stellar-border rounded-xl px-4 py-3 focus:outline-none focus:border-stellar-violet transition-colors" placeholder="Your Email" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-stellar-muted font-bold">Message</label>
              <textarea rows={5} className="w-full bg-stellar-bg border border-stellar-border rounded-xl px-4 py-3 focus:outline-none focus:border-stellar-violet transition-colors resize-none" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" className="w-full bg-stellar-violet text-stellar-bg py-4 rounded-xl font-bold hover:bg-stellar-violet/90 transition-all">
              Send Cosmic Signal
            </button>
          </form>
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
