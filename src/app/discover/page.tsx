// Descobrir Destinos: recebe a busca da página inicial pela URL.
import { DiscoverClient } from '@/components/discover/DiscoverClient';

export const metadata = { title: 'Descobrir Destinos | GarimpaTrip' };

type Params = { origin?: string; destination?: string; budget?: string; month?: string };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  return (
    <DiscoverClient
      initialOrigin={sp.origin ?? ''}
      initialDestination={sp.destination ?? ''}
      initialBudget={sp.budget ?? ''}
      initialMonth={sp.month ?? ''}
    />
  );
}
