const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const tabs = document.querySelectorAll(".category-tab");
const panels = document.querySelectorAll(".category-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    panels.forEach((panel) => {
      panel.hidden = true;
    });

    tabs.forEach((button) => {
      button.classList.remove("active");
    });

    const panel = document.getElementById(tab.dataset.target);

    if (panel) {
      panel.hidden = false;
      tab.classList.add("active");
    }
  });
});