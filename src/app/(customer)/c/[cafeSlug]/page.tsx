import { CustomerClient } from '@/components/customer/CustomerClient';

export const dynamic = 'force-dynamic';

interface CustomerPageProps {
  params: Promise<{ cafeSlug: string }>;
}

export default async function CustomerPhotoboothPage({ params }: CustomerPageProps) {
  const resolved = await params;
  return <CustomerClient cafeSlug={resolved.cafeSlug} />;
}
