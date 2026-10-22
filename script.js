const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const tabs = document.querySelectorAll(".category-tab");
const panels = document.querySelectorAll(".category-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    panels.forEach((panel) => (panel.hidden = true));

    tabs.forEach((button) => {
      button.classList.remove("active");
      button.setAttribute("aria-selected", "false");
    });

    const panel = document.getElementById(tab.dataset.target);
    if (panel) {
      panel.hidden = false;
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      history.replaceState(null, "", "#" + tab.dataset.target);
    }
  });
});

// Open the tab named in the URL (for example project.html#photos-panel)
const startTab = document.querySelector(
  '.category-tab[data-target="' + location.hash.slice(1) + '"]'
);
if (startTab) startTab.click();

// Turn on the fade only after the starting tab is set
document.body.classList.add("tabs-ready");

// Clear the old saved theme from visitors' browsers
try { localStorage.removeItem("theme"); } catch (e) {}

if ("scrollRestoration" in history) history.scrollRestoration = "manual";