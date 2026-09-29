// language: JavaScript, file: index.js, target: GitHub Pages
// Frontend for a proxy endpoint. The endpoint must fetch the target URL server-side.

"use strict";

const PROXY_ENDPOINT = "https://SEU-PROXY.example.com/proxy";

const form = document.getElementById("proxy-form");
const url_input = document.getElementById("url");
const viewer = document.getElementById("viewer");
const status = document.getElementById("status");
const go_button = document.getElementById("go");

function normalize_url(value) {
  let url = value.trim();

  if (!url) {
    throw new Error("URL vazia.");
  }

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const parsed = new URL(url);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Somente HTTP e HTTPS são suportados.");
  }

  return parsed.href;
}

function build_proxy_url(target_url) {
  const endpoint = new URL(PROXY_ENDPOINT);
  endpoint.searchParams.set("url", target_url);
  return endpoint.href;
}

function set_status(message) {
  status.textContent = message;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    const target_url = normalize_url(url_input.value);
    const proxy_url = build_proxy_url(target_url);

    go_button.disabled = true;
    set_status(`Carregando ${target_url}`);

    viewer.src = proxy_url;

    viewer.onload = () => {
      go_button.disabled = false;
      set_status("Página carregada.");
    };

    viewer.onerror = () => {
      go_button.disabled = false;
      set_status("O proxy não conseguiu carregar a página.");
    };
  } catch (error) {
    go_button.disabled = false;
    set_status(error.message);
  }
});
