import { createApiClient } from "@/server/api";
import { isAxiosError } from "axios";

/** The audit journal as CSV: tRPC carries JSON, not files. Admin-only on the API. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  try {
    const api = await createApiClient({ req });
    const response = await api.get<ArrayBuffer>("/admin/audit-logs/export", {
      params: Object.fromEntries(searchParams),
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
    return Response.json({ error: "Export impossible." }, { status });
  }
}
