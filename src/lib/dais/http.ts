import https from "node:https";
import { getDaisApiBaseUrl, getDaisApiKey } from "@/lib/dais/config";
import { DaisApiError } from "@/lib/dais/errors";

type DaisHttpResponse = {
  status: number;
  body: string;
};

function tlsRejectUnauthorized(): boolean {
  return process.env.DAIS_API_TLS_REJECT_UNAUTHORIZED?.trim().toLowerCase() === "true";
}

export async function daisHttpGet(path: string): Promise<DaisHttpResponse> {
  const apiKey = getDaisApiKey();
  if (!apiKey) {
    throw new DaisApiError("Chybí DAIS_API_KEY.");
  }

  const baseUrl = getDaisApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: "application/json",
          "client-key": apiKey,
        },
        rejectUnauthorized: tlsRejectUnauthorized(),
      },
      (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({ status: response.statusCode ?? 0, body });
        });
      },
    );

    request.on("error", (error) => {
      reject(new DaisApiError(`Spojení s DAIS portálem selhalo: ${error.message}`));
    });

    request.setTimeout(20_000, () => {
      request.destroy(new DaisApiError("Vypršel časový limit odpovědi DAIS portálu."));
    });
  });
}
