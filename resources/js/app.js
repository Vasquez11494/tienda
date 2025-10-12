import './bootstrap';
import Alpine from 'alpinejs';

// =================== MODALES ===================
export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('[data-autofocus]')?.focus();
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  
  document.dispatchEvent(new CustomEvent('modalClosed', { detail: { modalId: id } }));
}

// Delegación global abrir/cerrar
document.addEventListener('click', (e) => {
  const openBtn = e.target.closest('[data-modal-open]');
  if (openBtn) {
    e.preventDefault();
    openModal(openBtn.getAttribute('data-modal-open'));
    return;
  }
  const closeBtn = e.target.closest('[data-modal-close]');
  if (closeBtn) {
    e.preventDefault();
    closeModal(closeBtn.getAttribute('data-modal-close'));
  }
});

// Cerrar con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('[id].fixed[aria-hidden="false"]').forEach((m) => {
      const modalId = m.id; // Capturar el ID antes de ocultar
      m.classList.add('hidden');
      m.setAttribute('aria-hidden', 'true');
      
      // ✅ Disparar evento para cada modal cerrado
      document.dispatchEvent(new CustomEvent('modalClosed', { detail: { modalId } }));
    });
    document.body.style.overflow = '';
  }
});

// =================== VALIDACIÓN ===================
// Clases “is-invalid” (rojo)
const INVALID_CLASSES = [
  'border-2', 'border-red-500',
  'bg-red-50',
  'ring-2', 'ring-red-200'
];
const LABEL_INVALID_CLASSES = ['text-red-700', 'font-medium'];

function clearInvalid(el, form) {
  el.classList.remove(...INVALID_CLASSES, 'error-field');
  el.removeAttribute('aria-invalid');
  const label = el.id ? form.querySelector(`label[for="${el.id}"]`) : null;
  label?.classList.remove(...LABEL_INVALID_CLASSES);
}

function markInvalid(el, form) {
  el.classList.add(...INVALID_CLASSES, 'error-field');
  el.setAttribute('aria-invalid', 'true');
  const label = el.id ? form.querySelector(`label[for="${el.id}"]`) : null;
  label?.classList.add(...LABEL_INVALID_CLASSES);

  // Limpieza en vivo (solo una vez)
  if (!el.dataset.liveClear) {
    const clear = () => {
      clearInvalid(el, form);
      el.removeEventListener('input', clear);
      el.removeEventListener('change', clear);
      delete el.dataset.liveClear;
    };
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
    el.dataset.liveClear = '1';
  }
}

function resetMarks(form) {
  const elements = Array.from(form.querySelectorAll('input, select, textarea'));
  elements.forEach(el => clearInvalid(el, form));
}

/**
 * Valida campos requeridos (excluye ids/names en `excepciones` y los que tengan data-optional)
 * @param {HTMLFormElement} formulario
 * @param {string[]} excepciones
 * @returns {boolean}
 */
export function validarFormulario(formulario, excepciones = []) {
  if (!formulario) return false;

  resetMarks(formulario);

  const elements = Array.from(formulario.querySelectorAll('input, select, textarea'));
  const invalids = [];

  elements.forEach(el => {
    if (el.type === 'hidden' || el.disabled || el.hasAttribute('data-optional')) return;
    if (excepciones.includes(el.id) || excepciones.includes(el.name)) return;

    const tipo = (el.type || '').toLowerCase();
    let vacio = false;

    if (tipo === 'checkbox' || tipo === 'radio') {
      const group = formulario.querySelectorAll(`input[name="${el.name}"]`);
      const alguno = Array.from(group).some(i => i.checked);
      vacio = !alguno;
    } else {
      vacio = !String(el.value || '').trim();
    }

    if (vacio) {
      invalids.push(el);
      markInvalid(el, formulario);
    }
  });

  if (invalids.length) {
    const primero = invalids[0];
    primero.focus({ preventScroll: true });
    primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  return true;
}


// ===== Utils de carga (GLOBAL) =====

// Overlay global con conteo de referencias
export const Loader = {
  el: null,
  _refs: 0,
  _ensure(text) {
    if (!this.el) {
      this.el = document.createElement("div");
      this.el.id = "globalLoader";
      this.el.className = "fixed inset-0 z-[9000] flex items-center justify-center bg-black/40";
      this.el.innerHTML = `
        <div class="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-white shadow-2xl">
          <svg class="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <p class="text-sm font-medium text-gray-700" id="globalLoaderText">${text || "Procesando…"}</p>
        </div>
      `;
      document.body.appendChild(this.el);
    } else if (text) {
      this.el.querySelector("#globalLoaderText").textContent = text;
    }
  },
  show(text = "Procesando…") {
    this._ensure(text);
    this._refs++;
    this.el.querySelector("#globalLoaderText").textContent = text;
    this.el.classList.remove("hidden");
    this.el.classList.add("flex");
    document.body.style.overflow = "hidden";
  },
  hide() {
    if (!this.el) return;
    this._refs = Math.max(0, this._refs - 1);
    if (this._refs === 0) {
      this.el.classList.add("hidden");
      this.el.classList.remove("flex");
      document.body.style.overflow = "";
    }
  }
};

// Estado de carga en botones (inline)
export const setBtnLoading = (btn, loading = true, textWhile = "Procesando…") => {
  if (!btn) return;
  if (loading) {
    if (!btn.dataset._originalHtml) {
      btn.dataset._originalHtml = btn.innerHTML;
      btn.dataset._originalWidth = `${btn.offsetWidth}px`;
    }
    btn.style.width = btn.dataset._originalWidth || "";
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        ${textWhile}
      </span>
    `;
  } else {
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    if (btn.dataset._originalHtml) {
      btn.innerHTML = btn.dataset._originalHtml;
      btn.style.width = "";
      delete btn.dataset._originalHtml;
      delete btn.dataset._originalWidth;
    }
  }
};


// =================== ALPINE ===================
if (!window.Alpine) window.Alpine = Alpine;
if (!window.__ALPINE_STARTED__) {
  window.__ALPINE_STARTED__ = true;
  Alpine.start();
}
