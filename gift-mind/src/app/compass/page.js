import CompassJourney from "@/components/compass/CompassJourney.jsx";

export const metadata = {
  title: "Gift Compass — GiftMind",
  description: "Tap through a few choices — get a personalized gift direction.",
};

export default function CompassPage() {
  return (
    <main className="min-h-screen bg-md-surface">
      <CompassJourney />
    </main>
  );
}
