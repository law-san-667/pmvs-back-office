import { createApiClient } from "@/server/api";
import { isAxiosError } from "axios";

/** An archived report as a file. Access is checked by the API. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "pdf";
  try {
    const api = await createApiClient({ req });
    const response = await api.get<ArrayBuffer>(`/reports/archives/${encodeURIComponent(id)}/file`, {
      params: { format },
      responseType: "arraybuffer",
      headers: { Accept: "*/*" },
    });
    return new Response(response.data, {
      headers: {
        "Content-Type": String(response.headers["content-type"]),
        "Content-Disposition": String(response.headers["content-disposition"]),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const status = isAxiosError(error) && error.response ? error.response.status : 502;
    return Response.json({ error: "Téléchargement impossible." }, { status });
  }
}
