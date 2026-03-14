const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

function isRequest(input) {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input, explicitMethod) {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

function isUrl(input) {
  return typeof URL !== "undefined" && input instanceof URL;
}

function resolveUrl(input) {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources) {
  const headers = new Headers();
  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
}

function getMediaType(headers) {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType) {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType) {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

function hasNoBody(response, method) {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body == null) return true;
  return false;
}

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text) {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value, key) {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value[key];
  if (typeof candidate !== "string") return undefined;
  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text, maxLength = 300) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response, data) {
  const prefix = `HTTP ${response.status} ${response.statusText}`;
  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }
  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");
  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  return prefix;
}

export class ApiError extends Error {
  constructor(response, data, requestInfo) {
    super(buildErrorMessage(response, data));
    this.name = "ApiError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.data = data;
    this.url = requestInfo.url;
    this.method = requestInfo.method;
  }
}

async function parseErrorBody(response, method) {
  if (hasNoBody(response, method)) return null;
  const mediaType = getMediaType(response.headers);
  try {
    if (isJsonMediaType(mediaType)) return await response.json();
    if (isTextMediaType(mediaType)) return await response.text();
    return null;
  } catch {
    return null;
  }
}

async function parseSuccessBody(response, responseType, requestInfo) {
  if (hasNoBody(response, requestInfo.method)) return null;

  switch (responseType) {
    case "auto": {
      const mediaType = getMediaType(response.headers);
      if (isJsonMediaType(mediaType)) {
        return await response.json();
      }
      if (isTextMediaType(mediaType)) {
        const text = stripBom(await response.text());
        if (looksLikeJson(text)) {
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        }
        return text;
      }
      return response.blob();
    }
    case "json":
      return await response.json();
    case "text":
      return stripBom(await response.text());
    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          'Blob responses are not supported in this runtime. Use responseType "json" or "text" instead.',
        );
      }
      return response.blob();
  }
}

export async function customFetch(input, options = {}) {
  const { responseType = "auto", headers: headersInit, ...init } = options;

  const method = resolveMethod(input, init.method);

  if (init.body != null && (method === "GET" || method === "HEAD")) {
    throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
  }

  const headers = mergeHeaders(isRequest(input) ? input.headers : undefined, headersInit);

  if (
    typeof init.body === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(init.body)
  ) {
    headers.set("content-type", "application/json");
  }

  if (responseType === "json" && !headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  const requestInfo = { method, url: resolveUrl(input) };

  const response = await fetch(input, { ...init, method, headers });

  if (!response.ok) {
    const errorData = await parseErrorBody(response, method);
    throw new ApiError(response, errorData, requestInfo);
  }

  return await parseSuccessBody(response, responseType, requestInfo);
}
