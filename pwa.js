let deferredInstallPrompt = null;

const installButtons = [
  document.querySelector("#installButton"),
  document.querySelector("#dbInstallButton"),
].filter(Boolean);

function setInstallButtonsVisible(isVisible) {
  installButtons.forEach((button) => {
    button.hidden = !isVisible;
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  setInstallButtonsVisible(true);
});

installButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    setInstallButtonsVisible(false);
  });
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  setInstallButtonsVisible(false);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Service worker is optional. The app still runs without offline cache.
    });
  });
}
