import { BusinessDetails } from "./business-details";

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BusinessDetails id={id} />;
}
