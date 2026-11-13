import { PackageClient } from '@/components/package/PackageClient';
export const metadata = { title: 'Meu Pacote | GarimpaTrip' };
export default async function PackagePage({ searchParams }: { searchParams: Promise<{ trip?: string }> }) {
  const { trip } = await searchParams;
  return <PackageClient initialTripId={trip} />;
}
