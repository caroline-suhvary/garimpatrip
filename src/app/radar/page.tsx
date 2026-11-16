// Radar de Preços Aéreos: lê o histórico gravado pelo robô diário (GitHub Actions).
import { RadarClient } from "@/components/radar/RadarClient";

export const metadata = { title: "Radar de Preços | GarimpaTrip" };

export default function RadarPage() {
  return <RadarClient />;
}
