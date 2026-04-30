export const metadata = {
  title: 'Privacy Policy | TechnoNexus',
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-6 py-24 max-w-4xl space-y-12 text-slate-300 relative z-10">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-4 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          Privacy Policy
        </h1>
        <p className="text-xl text-slate-400">Last updated: April 30, 2026</p>
      </div>

      <div className="space-y-8 glass-panel p-8 md:p-12 rounded-[2rem]">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">1. Introduction</h2>
          <p>
            Welcome to TechnoNexus. We respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you use our website (technonexus.ca) 
            and our mobile application (Nexus Arcade).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">2. Data We Collect</h2>
          <p>We may collect and process the following data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> If you register via Supabase Auth (e.g., Google OAuth, Email), we store your email address and profile name.</li>
            <li><strong>Game Data:</strong> Custom AI prompts, generated game payloads, and scores saved to your "Nexus Vault".</li>
            <li><strong>Multiplayer Data:</strong> Ephemeral PeerJS WebRTC connections are used for live multiplayer. This data is transmitted peer-to-peer and is not permanently stored on our servers.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide, operate, and maintain our services.</li>
            <li>To enable real-time multiplayer features via PeerJS.</li>
            <li>To generate dynamic AI content using Google's Gemini API (user prompts are sent to Gemini for processing).</li>
            <li>To manage your account and stored Vault items securely via Supabase.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">4. Third-Party Services</h2>
          <p>We use the following third-party services which may collect data according to their own privacy policies:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Supabase:</strong> For database and authentication infrastructure.</li>
            <li><strong>Google Gemini AI:</strong> For processing AI game generation prompts and evaluating submissions.</li>
            <li><strong>PeerJS:</strong> For establishing peer-to-peer connections during multiplayer sessions.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">5. Data Security</h2>
          <p>
            We implement reasonable security measures, including Supabase Row Level Security (RLS), to protect your data. 
            However, no method of transmission over the Internet or electronic storage is 100% secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">6. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. You can delete items from your Vault directly within the app, 
            or contact us to delete your account entirely.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us via our official channels.
          </p>
        </section>
      </div>
    </div>
  );
}
