/* ==========================================
   AURA — SETTINGS
========================================== */

console.log("AURA Settings cargado");

// La musica sigue sonando aunque Ajustes
// no tenga reproductor visible.
window.addEventListener(
    "pywebviewready",
    () => {

        window.AuraPlayer.restore();

    }
);
