const intro = document.getElementById("intro");
const app = document.getElementById("app");
const continueButton = document.getElementById("continueButton");

setTimeout(() => {
    continueButton.classList.add("show");
}, 5000);

continueButton.addEventListener("click", () => {
    intro.classList.add("hide");

    setTimeout(() => {
        window.location.href = "menu.html";
    }, 1000);
});