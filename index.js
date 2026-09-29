```javascript
// language: JavaScript, file: index.js, target: GitHub Pages
// Fetches remote HTML through a CORS relay and displays it in the local viewer.

"use strict";

const CORS_PROXY = "https://api.allorigins.win/raw?url=";

const form = document.getElementById("proxy-form");
const input = document.getElementById("url");
const button = document.getElementById("go");
const status = document.getElementById("status");
const frame = document.getElementById("page");

function normalize_url(value) {
  let value_clean = value.trim();

  if (!value_clean) {
    throw new Error("Digite uma URL.");
  }

  if (!/^https?:\/\//i.test(value_clean)) {
    value_clean = `https://${value_clean}`;
  }

  const parsed = new URL(value_clean);

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error("Apenas HTTP e HTTPS são suportados.");
  }

  return parsed.href;
}

function set_status(message) {
  status.textContent = message;
}

function create_proxy_url(target_url) {
  return CORS_PROXY + encodeURIComponent(target_url);
}

function rewrite_links(document_object, base_url) {
  const elements = document_object.querySelectorAll(
    "[href], [src], [action]"
  );

  for (const element of elements) {
    for (const attribute of ["href", "src", "action"]) {
      if (!element.hasAttribute(attribute)) {
        continue;
      }

      const value = element.getAttribute(attribute);

      if (
        !value ||
        value.startsWith("#") ||
        value.startsWith("data:") ||
        value.startsWith("javascript:")
      ) {
        continue;
      }

      try {
        const absolute = new URL(value, base_url).href;
        element.setAttribute(attribute, absolute);
      } catch {
        // Ignore malformed URLs.
      }
    }
  }
}

async function load_page(target_url) {
  const proxy_url = create_proxy_url(target_url);

  const response = await fetch(proxy_url, {
    method: "GET",
    headers: {
      "Accept": "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(
      `O proxy respondeu HTTP ${response.status}.`
    );
  }

  const content_type = response.headers.get("content-type") || "";

  if (
    !content_type.includes("text/html") &&
    !content_type.includes("application/xhtml+xml")
  ) {
    throw new Error(
      `O destino retornou ${content_type || "um conteúdo não-HTML"}.`
    );
  }

  const html = await response.text();

  if (!html.trim()) {
    throw new Error("O destino retornou uma resposta vazia.");
  }

  return html;
}

function render_page(html, target_url) {
  const parser = new DOMParser();
  const document_object = parser.parseFromString(
    html,
    "text/html"
  );

  rewrite_links(document_object, target_url);

  document_object
    .querySelectorAll("script")
    .forEach((script) => script.remove());

  const serialized = document_object.documentElement.outerHTML;

  frame.srcdoc = serialized;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  let target_url;

  try {
    target_url = normalize_url(input.value);
  } catch (error) {
    set_status(error.message);
    return;
  }

  button.disabled = true;
  set_status(`Carregando ${target_url}...`);

  try {
    const html = await load_page(target_url);

    render_page(html, target_url);

    set_status(`Carregado: ${target_url}`);
  } catch (error) {
    frame.srcdoc = `
      <!doctype html>
      <html>
        <body style="
          font-family:Arial;
          padding:30px;
          background:#fff;
          color:#222;
        ">
          <h2>Falha ao carregar</h2>
          <p>${escape_html(error.message)}</p>
        </body>
      </html>
    `;

    set_status("Falha ao carregar a página.");
  } finally {
    button.disabled = false;
  }
});

function escape_html(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

input.value = "https://example.com";
```
