/** ASCII fallback pro starší prohlížeče (bez diakritiky). */
function asciiFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "_");
}

/** RFC 5987 — správné UTF-8 jméno souboru v Content-Disposition. */
export function contentDispositionAttachment(filename: string): string {
  const fallback = asciiFilename(filename);
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

/** Parsuje jméno souboru z hlavičky Content-Disposition. */
export function parseContentDispositionFilename(disposition: string): string | null {
  const star = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      /* fall through */
    }
  }

  const quoted = disposition.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return decodeFilenameValue(quoted[1]);

  const unquoted = disposition.match(/filename=([^;\n]+)/i);
  if (unquoted?.[1]) return decodeFilenameValue(unquoted[1].trim());

  return null;
}

function decodeFilenameValue(value: string): string {
  if (!/%[0-9A-Fa-f]{2}/.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
