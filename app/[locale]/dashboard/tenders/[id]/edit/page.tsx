import TenderForm from "@/components/forms/tender-form";

export default async function EditTenderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TenderForm tenderId={id} />;
}
