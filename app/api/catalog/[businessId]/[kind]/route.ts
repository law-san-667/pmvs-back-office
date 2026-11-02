import { createApiClient } from "@/server/api";
import { isAxiosError } from "axios";

/**
 * Catalogue spreadsheets go through here: tRPC carries JSON, not files.
 * GET template|export downloads; POST import forwards the uploaded file.
 */
type Params = { params: Promise<{ businessId: string; kind: string }> };

const UUID = /^[0-9a-f-]{36}$/i;

const failure = (error: unknown) => {
  if (isAxiosError(error) && error.response) {
    let message = "Opération impossible.";
    const data = error.response.data;
    try {
      const body =
        data instanceof ArrayBuffer || Buffer.isBuffer(data)
          ? JSON.parse(Buffer.from(data as ArrayBuffer).toString("utf8"))
          : data;
      if (typeof body?.error === "string") message = body.error;
    } catch {
      // Keep the generic message.
    }
    return Response.json({ error: message }, { status: error.response.status });
  }
  return Response.json({ error: "Service indisponible." }, { status: 502 });
};

export async function GET(req: Request, { params }: Params) {
  const { businessId, kind } = await params;
  if (!UUID.test(businessId) || (kind !== "template" && kind !== "export")) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  try {
    const api = await createApiClient({ req });
    const response = await api.get<ArrayBuffer>(
      `/businesses/${businessId}/catalog/${kind}`,
      { responseType: "arraybuffer", headers: { Accept: "*/*" } },
    );
    return new Response(response.data, {
      headers: {
        "Content-Type": String(response.headers["content-type"]),
        "Content-Disposition": String(response.headers["content-disposition"]),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req: Request, { params }: Params) {
  const { businessId, kind } = await params;
  if (!UUID.test(businessId) || kind !== "import") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  const dryRun = new URL(req.url).searchParams.get("dryRun") !== "false";
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Joignez le fichier Excel." }, { status: 422 });
  }
  if (file.size > 1024 * 1024) {
    return Response.json(
      { error: "Fichier trop lourd : 1 Mo au plus (200 lignes)." },
      { status: 413 },
    );
  }
  try {
    const api = await createApiClient({ req });
    const body = new FormData();
    body.append("file", file, file.name);
    const response = await api.post(
      `/businesses/${businessId}/catalog/import`,
      body,
      { params: { dryRun }, headers: { "Content-Type": undefined } },
    );
    return Response.json(response.data);
  } catch (error) {
    return failure(error);
  }
}
