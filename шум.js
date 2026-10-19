const grid = document.getElementById("grid");
const signal = document.getElementById("signal");
const collected = document.getElementById("collected");
const message = document.getElementById("message");
const resetButton = document.getElementById("resetButton");

const secretWord = "SIGNAL";

// Номера клеток, содержащих буквы пароля
const secretPositions = [3, 12, 21, 30, 45, 58];

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&";

let cells = [];
let foundLetters = 0;
let gameOver = false;

let audioContext = null;
let noiseSource = null;
let noiseGain = null;

// Создание электронного шума
function startNoise() {
  if (gameOver || noiseSource) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      message.textContent =
        "AUDIO UNAVAILABLE // ИЩИ ПАРОЛЬ";
      return;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const bufferSize = audioContext.sampleRate * 2;

    const buffer = audioContext.createBuffer(
      1,
      bufferSize,
      audioContext.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }

    noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.035;

    noiseSource.connect(noiseGain);
    noiseGain.connect(audioContext.destination);

    noiseSource.start();
  } catch (error) {
    console.warn("Audio unavailable:", error);
  }
}

// Полная остановка шума
function stopNoise() {
  if (noiseSource) {
    try {
      noiseSource.stop();
      noiseSource.disconnect();
    } catch (error) {
      // Источник уже остановлен
    }
  }

  if (noiseGain) {
    noiseGain.disconnect();
  }

  noiseSource = null;
  noiseGain = null;
}

// Генерация визуальных помех
function generateNoise() {
  let text = "";

  for (let i = 0; i < 180; i++) {
    text += alphabet[
      Math.floor(Math.random() * alphabet.length)
    ];

    text += i % 18 === 17 ? "\n" : " ";
  }

  return text;
}

// Запуск или перезапуск игры
function startGame() {
  stopNoise();

  grid.innerHTML = "";
  cells = [];
  foundLetters = 0;
  gameOver = false;

  document.body.classList.remove("signal-found");

  collected.textContent = "_ _ _ _ _ _";
  signal.textContent = generateNoise();

  message.textContent =
    "NOISE ACTIVE // SIGNAL NOT FOUND";

  for (let i = 0; i < 64; i++) {
    const button = document.createElement("button");

    button.className = "cell";
    button.type = "button";
    button.textContent = i + 1;

    button.setAttribute(
      "aria-label",
      "Клетка " + (i + 1)
    );

    const secretIndex = secretPositions.indexOf(i);

    if (secretIndex !== -1) {
      button.dataset.letter = secretWord[secretIndex];
      button.dataset.secret = "true";
    } else {
      button.dataset.letter =
        alphabet[Math.floor(Math.random() * alphabet.length)];

      button.dataset.secret = "false";
    }

    button.addEventListener("click", function () {
      revealCell(button);
    });

    cells.push(button);
    grid.appendChild(button);
  }
}

// Открытие клетки
function revealCell(button) {
  if (gameOver || button.disabled) return;

  // Браузер разрешает звук после нажатия игрока
  startNoise();

  const letter = button.dataset.letter;

  button.textContent = letter;
  button.classList.add("revealed");

  if (button.dataset.secret === "true") {
    const expectedLetter = secretWord[foundLetters];

    if (letter === expectedLetter) {
      button.classList.add("correct");
      button.disabled = true;

      foundLetters++;

      updateCollected();

      message.textContent =
        "SIGNAL FRAGMENT FOUND // " +
        foundLetters + " / " + secretWord.length;

      if (foundLetters === secretWord.length) {
        finishGame();
      }
    } else {
      button.classList.add("wrong");

      message.textContent =
        "WRONG ORDER // ИЩИ БУКВУ " +
        secretWord[foundLetters];

      setTimeout(function () {
        if (!gameOver && !button.disabled) {
          button.classList.remove("wrong");
          button.classList.add("revealed");
        }
      }, 500);
    }
  } else {
    button.classList.add("wrong");
    button.disabled = true;

    message.textContent =
      "NOISE DETECTED // ЭТО ПОМЕХА";
  }
}

// Отображение собранных букв
function updateCollected() {
  const letters = secretWord
    .slice(0, foundLetters)
    .split("")
    .join(" ");

  const blanks = Array(secretWord.length - foundLetters)
    .fill("_")
    .join(" ");

  collected.textContent = [letters, blanks]
    .filter(Boolean)
    .join(" ");
}

// Пароль найден
function finishGame() {
  gameOver = true;

  stopNoise();

  document.body.classList.add("signal-found");

  signal.textContent =
    "SIGNAL LOCKED // NOISE TERMINATED";

  collected.textContent = secretWord.split("").join(" ");

  message.textContent =
    "✓ PASSWORD ACCEPTED // NOISE TERMINATED";

  cells.forEach(function (cell) {
    cell.disabled = true;
  });
}

// Кнопка перезапуска
resetButton.addEventListener("click", startGame);

// Запускаем игру
startGame();
