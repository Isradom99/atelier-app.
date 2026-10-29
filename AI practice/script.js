/* =========================================================
   Atelier Academy PWA
   Conecta correo / Google Sheets pegando tus claves abajo.
   ========================================================= */

// EmailJS: https://www.emailjs.com  → Account / Email Services / Email Templates
const EMAILJS_PUBLIC_KEY = ""; // ej: "xxxxxxxx"
const EMAILJS_SERVICE_ID = ""; // ej: "service_xxx"
const EMAILJS_TEMPLATE_ID = ""; // ej: "template_xxx"

// Formspree: https://formspree.io  → URL del formulario
const FORMSPREE_URL = ""; // ej: "https://formspree.io/f/xxxxxx"

// Google Sheets: Apps Script → Deploy → Web app → copiar URL
const GOOGLE_SHEET_WEBHOOK = ""; // ej: "https://script.google.com/macros/s/.../exec"

const WHATSAPP_BASE = "https://wa.me/524427833757";
const HORARIOS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
];

const form = document.getElementById("cita-form");
const horaSelect = document.getElementById("hora");
const fechaInput = document.getElementById("fecha");
const errorEl = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");
const vistaCita = document.getElementById("vista-cita");
const vistaOk = document.getElementById("vista-ok");

HORARIOS.forEach(function (hora) {
  const option = document.createElement("option");
  option.value = hora;
  option.textContent = hora;
  horaSelect.appendChild(option);
});

const hoy = new Date();
fechaInput.min =
  hoy.getFullYear() +
  "-" +
  String(hoy.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(hoy.getDate()).padStart(2, "0");

document.querySelectorAll(".js-whatsapp").forEach(function (link) {
  const msg = encodeURIComponent("Hola, me interesa agendar una cita en Atelier Academy.");
  link.setAttribute("href", WHATSAPP_BASE + "?text=" + msg);
});

function esAppInstalada() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function esIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

const iosTip = document.getElementById("ios-tip");
if (iosTip && esIOS() && !esAppInstalada()) {
  iosTip.classList.remove("hidden");
}
document.getElementById("cerrar-tip")?.addEventListener("click", function () {
  iosTip.classList.add("hidden");
});

function mostrarError(mensaje) {
  errorEl.textContent = mensaje;
  errorEl.classList.remove("hidden");
  submitBtn.disabled = false;
  submitBtn.textContent = "Agendar Cita";
}

function leerCita() {
  return {
    nombre: document.getElementById("nombre").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    email: document.getElementById("email").value.trim(),
    servicio: document.getElementById("servicio").value,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
  };
}

function mostrarConfirmacion(cita) {
  vistaCita.classList.add("hidden");
  vistaOk.classList.remove("hidden");
  vistaOk.classList.add("flex");

  const partes = [cita.nombre, cita.servicio, cita.fecha + " · " + cita.hora].filter(Boolean);
  document.getElementById("detalle").textContent = partes.join("  ·  ");

  const mensaje = encodeURIComponent(
    "Hola, soy " + cita.nombre +
    " y agendé " + cita.servicio +
    " el " + cita.fecha + " a las " + cita.hora +
    " en Atelier Academy."
  );
  document.getElementById("wa-ok").href = WHATSAPP_BASE + "?text=" + mensaje;
  window.scrollTo(0, 0);
}

document.getElementById("volver-btn").addEventListener("click", function () {
  form.reset();
  vistaOk.classList.add("hidden");
  vistaOk.classList.remove("flex");
  vistaCita.classList.remove("hidden");
  submitBtn.disabled = false;
  submitBtn.textContent = "Agendar Cita";
});

function enviarEmailJS(cita) {
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    return Promise.resolve();
  }
  if (window.emailjs) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, cita);
}

function enviarFormspree(cita) {
  if (!FORMSPREE_URL) return Promise.resolve();
  return fetch(FORMSPREE_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(cita),
  });
}

function enviarGoogleSheets(cita) {
  if (!GOOGLE_SHEET_WEBHOOK) return Promise.resolve();
  return fetch(GOOGLE_SHEET_WEBHOOK, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(cita),
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  errorEl.classList.add("hidden");
  const cita = leerCita();

  if (!cita.nombre || !cita.telefono || !cita.email || !cita.servicio || !cita.fecha || !cita.hora) {
    mostrarError("Completa todos los campos para agendar.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Agendando...";

  Promise.allSettled([
    enviarEmailJS(cita),
    enviarFormspree(cita),
    enviarGoogleSheets(cita),
  ]).then(function () {
    mostrarConfirmacion(cita);
  });
});

/* Registrar PWA (funciona en HTTPS: Netlify, Vercel, GitHub Pages) */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").catch(function () {
      /* En file:// el SW no se registra; súbelo a un hosting HTTPS. */
    });
  });
}
