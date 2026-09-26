const intro = document.getElementById("intro");
const app = document.getElementById("app");
const continueButton = document.getElementById("continueButton");

// Al abrir la app se descarta la musica de la
// sesion anterior: empieza en silencio.
if (window.AuraPlayer) {

    window.AuraPlayer.forget();

}

setTimeout(() => {
    continueButton.classList.add("show");
}, 5000);

continueButton.addEventListener("click", () => {
    intro.classList.add("hide");

    setTimeout(() => {
        window.location.href = "menu.html";
    }, 1000);
});