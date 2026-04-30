export const metadata = {
  title: 'Terms of Service | TechnoNexus',
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-6 py-24 max-w-4xl space-y-12 text-slate-300 relative z-10">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-4 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          Terms of Service
        </h1>
        <p className="text-xl text-slate-400">Last updated: April 30, 2026</p>
      </div>

      <div className="space-y-8 glass-panel p-8 md:p-12 rounded-[2rem]">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the TechnoNexus platform and the Nexus Arcade mobile application, you agree to be bound by these Terms of Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">2. Use of Services</h2>
          <p>
            You agree to use our services only for lawful purposes. You must not use the AI generation features to create harmful, offensive, or illegal content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials (via Supabase Auth) and for all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">4. AI and User Generated Content</h2>
          <p>
            Our platform utilizes AI (Google Gemini) to generate content based on user prompts. We do not guarantee the accuracy or appropriateness of AI-generated content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">5. Limitation of Liability</h2>
          <p>
            TechnoNexus is provided "as is" without warranties of any kind. We shall not be liable for any damages arising out of your use of our services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">6. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Your continued use of the platform constitutes acceptance of the new terms.
          </p>
        </section>
      </div>
    </div>
  );
}
