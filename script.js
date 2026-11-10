const frequencySlider = document.querySelector("#frequency");
const frequencyValue = document.querySelector("#frequency-value");
const outputFrequency = document.querySelector("#output-frequency");
const outputVoltage = document.querySelector("#output-voltage");
const motorStatus = document.querySelector("#motor-status");


const terminalMode = document.querySelector("#terminal-mode");
const terminalControls = document.querySelector("#terminal-controls");
const terminalExplanation = document.querySelector("#terminal-explanation");
const keypadStop = document.querySelector("#keypad-stop");

const MAX_FREQUENCY = 50;
const MAX_VOLTAGE = 220;
const RAMP_UP_SECONDS = 10;
const RAMP_DOWN_SECONDS = 10;

let commandFrequency = Number(frequencySlider.value);
let actualFrequency = 0;
let m0Closed = false;
let m1Closed = false;
let keypadStopped = false;
let direction = "Forward";
let pendingDirection = null;
let lastFrame = performance.now();

function getRequestedCommand() {
  if (keypadStopped) {
    return { running: false, direction };
  }

  if (terminalMode.value === "d1") {
    if (m0Closed && !m1Closed) {
      return { running: true, direction: "Forward" };
    }

    if (m1Closed && !m0Closed) {
      return { running: true, direction: "Reverse" };
    }

    return { running: false, direction };
  }

  // d2: M0 closed = Run; M1 open = Forward, closed = Reverse.
  if (!m0Closed) {
    return { running: false, direction };
  }

  return {
    running: true,
    direction: m1Closed ? "Reverse" : "Forward",
  };
}


function renderTerminalControls() {
  const isD1 = terminalMode.value === "d1";

  terminalControls.innerHTML = `
    <label class="terminal-switch">
      <input id="m0-input" type="checkbox">
      <span>M0 — ${isD1 ? "FWD / STOP" : "RUN / STOP"}</span>
    </label>

    <label class="terminal-switch">
      <input id="m1-input" type="checkbox">
      <span>M1 — ${isD1 ? "REV / STOP" : "REV / FWD"}</span>
    </label>
  `;

  terminalExplanation.innerHTML =
  terminalMode.value === "d1"
    ? "d1: M0 open = Stop, closed = Forward Run.<br>" +
      "M1 open = Stop, closed = Reverse Run.<br>" +
      "Direction changes ramp through 0 Hz."
    : "d2: M0 open = Stop, closed = Run.<br>" +
      "With M0 closed, M1 open = Forward and closed = Reverse.<br>" +
      "Direction changes ramp through 0 Hz.";

  document.querySelector("#m0-input").addEventListener("change", (event) => {
    m0Closed = event.target.checked;
    keypadStopped = false;

    if (terminalMode.value === "d1" && m0Closed && direction === "Reverse") {
      pendingDirection = "Forward";
    }
  });

  document.querySelector("#m1-input").addEventListener("change", (event) => {
    m1Closed = event.target.checked;
    keypadStopped = false;

    if (terminalMode.value === "d1" && m1Closed && direction === "Forward") {
      pendingDirection = "Reverse";
    }
  });

  m0Closed = false;
  m1Closed = false;
  updateReadouts();
}

function updateReadouts() {
  outputFrequency.textContent = actualFrequency.toFixed(1);

  const voltage =
    actualFrequency <= 0
      ? 0
      : (actualFrequency / MAX_FREQUENCY) * MAX_VOLTAGE;

  outputVoltage.textContent = String(Math.round(voltage));

  if (actualFrequency > 0.05) {
    motorStatus.textContent = `${direction} — Running`;
  } else {
    motorStatus.textContent = "Stopped";
  }
}

frequencySlider.addEventListener("input", () => {
  commandFrequency = Number(frequencySlider.value);
  frequencyValue.textContent = commandFrequency.toFixed(1);
});

terminalMode.addEventListener("change", () => {
  keypadStopped = false;
  pendingDirection = null;
  renderTerminalControls();
});

keypadStop.addEventListener("click", () => {
  keypadStopped = true;
  pendingDirection = null;
  m0Closed = false;
  m1Closed = false;

  const m0 = document.querySelector("#m0-input");
  const m1 = document.querySelector("#m1-input");

  if (m0) m0.checked = false;
  if (m1) m1.checked = false;
});

function animate(now) {
  const elapsedSeconds = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;

  const requested = getRequestedCommand();

  if (requested.running) {
    if (requested.direction !== direction && pendingDirection === null) {
      pendingDirection = requested.direction;
    }
  } else if (terminalMode.value === "d2") {
    if (m0Closed && pendingDirection === null) {
      const desiredDirection = m1Closed ? "Reverse" : "Forward";

      if (desiredDirection !== direction) {
        pendingDirection = desiredDirection;
      }
    }
  }

  let targetFrequency;

  if (pendingDirection !== null) {
    targetFrequency = 0;
  } else if (requested.running && requested.direction === direction) {
    targetFrequency = commandFrequency;
  } else {
    targetFrequency = 0;
  }

  const rampSeconds =
    targetFrequency < actualFrequency ? RAMP_DOWN_SECONDS : RAMP_UP_SECONDS;
  const rampRate = MAX_FREQUENCY / rampSeconds;
  const difference = targetFrequency - actualFrequency;
  const maxChange = rampRate * elapsedSeconds;

  if (Math.abs(difference) <= maxChange) {
    actualFrequency = targetFrequency;
  } else {
    actualFrequency += Math.sign(difference) * maxChange;
  }

  if (pendingDirection !== null && actualFrequency <= 0.001) {
    actualFrequency = 0;
    direction = pendingDirection;
    pendingDirection = null;
  }

  updateReadouts();
  requestAnimationFrame(animate);   
   
}

frequencyValue.textContent = commandFrequency.toFixed(1);
renderTerminalControls();
requestAnimationFrame(animate);

 