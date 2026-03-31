import Hero from '../components/Hero';
import Ecosystem from '../components/Ecosystem';
import Consulting from '../components/Consulting';
import Vision from '../components/Vision';

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-24">
      <Hero />
      <Ecosystem />
      <Consulting />
      <Vision />
    </main>
  );
}
