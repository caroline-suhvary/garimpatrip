// Caixa de Descobertas (triagem temporária). Aceita ?trip=<id> para abrir uma viagem específica.
import { BoxClient } from '@/components/box/BoxClient';

export const metadata = { title: 'Caixa de Descobertas | GarimpaTrip' };

export default async function BoxPage({ searchParams }: { searchParams: Promise<{ trip?: string }> }) {
  const { trip } = await searchParams;
  return <BoxClient initialTripId={trip} />;
}
