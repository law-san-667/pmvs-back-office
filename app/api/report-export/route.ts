import { createApiClient } from "@/server/api";
import { isAxiosError } from "axios";

/** A report as a file: tRPC carries JSON, not files. Access is checked by the API. */
export async function POST(req: Request) {
  try {
    const api = await createApiClient({ req });
    const response = await api.post<ArrayBuffer>("/reports/export", await req.json(), {
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
    if (isAxiosError(error) && error.response) {
      let message = "Export impossible.";
      try {
        const body = JSON.parse(Buffer.from(error.response.data).toString());
        message = body.error ?? message;
      } catch {}
      return Response.json({ error: message }, { status: error.response.status });
    }
    return Response.json({ error: "Export impossible." }, { status: 502 });
  }
}
