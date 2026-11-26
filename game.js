(() => {
  const root = document.querySelector("[data-game]");
  if (!root) return;
  const api = `${root.dataset.apiBase || ""}/api/game`;
  const field = (name) => root.querySelector(`[data-${name}]`);
  const startButton = field("start");
  const restartButton = field("restart");
  const answerForm = field("answer-form");
  const answerInput = field("answer");
  const nameForm = field("name-form");
  const nameInput = field("name");
  const error = field("error");
  let sessionId = null;
  let deadline = 0;
  let timer = null;
  let busy = false;
  let lastScore = 0;
  let cloudTravel = 0;

  async function send(body) {
    const response = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Please try again.");
    return data;
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  function showLeaders(leaders) {
    const list = field("leaderboard");
    list.replaceChildren();
    if (!leaders.length) {
      const item = document.createElement("li");
      item.textContent = "No scores yet";
      list.append(item);
      return;
    }
    leaders.forEach((leader) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const score = document.createElement("strong");
      name.textContent = leader.name;
      score.textContent = String(leader.score);
      item.append(name, score);
      list.append(item);
    });
  }

  function showScore(score) {
    field("score").textContent = String(score);
    if (score === 0) cloudTravel = 0;
    else if (score > lastScore) cloudTravel += 140 + Math.min(280, (score - lastScore) * 0.5);
    lastScore = score;

    const visibleRange = Math.min(500, Math.max(50, Math.ceil((score + 25) / 50) * 50));
    const lowerBound = Math.max(0, Math.floor((score - visibleRange * 0.45) / 5) * 5);
    const labels = root.querySelectorAll(".game-altitude span");
    [lowerBound + visibleRange, lowerBound + visibleRange / 2, lowerBound].forEach((value, index) => {
      labels[index].textContent = `${value.toLocaleString()} pts`;
    });
    root.style.setProperty("--rise-height", `${((score - lowerBound) / visibleRange) * 72}%`);
    root.style.setProperty("--cloud-back-shift", `${Math.round(cloudTravel * 0.42)}px`);
    root.style.setProperty("--cloud-front-shift", `${Math.round(cloudTravel)}px`);
  }

  function categoryLabel(data) {
    return data.points ? `${data.category[0].toUpperCase()}${data.category.slice(1)} · ` : "";
  }

  function tick() {
    const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    field("time").textContent = String(seconds);
    if (seconds === 0 && !busy && sessionId) void submitAnswer("");
  }

  function beginRound(data, message = "") {
    deadline = data.deadline;
    field("round").textContent = `${data.round + 1} / 7`;
    field("kicker").textContent = "Think of the rarest plausible answer";
    field("prompt").textContent = data.prompt;
    field("result").textContent = message;
    answerInput.value = "";
    answerForm.hidden = false;
    nameForm.hidden = true;
    startButton.hidden = true;
    restartButton.hidden = true;
    clearInterval(timer);
    timer = setInterval(tick, 100);
    tick();
    answerInput.focus();
  }

  function finish(data) {
    clearInterval(timer);
    field("round").textContent = "7 / 7";
    field("time").textContent = "0";
    field("kicker").textContent = "Run complete";
    field("prompt").textContent = `${data.score} points`;
    field("result").textContent = `Final answer: ${categoryLabel(data)}+${data.points} points. ${data.explanation} ${data.eligible
      ? "You made the top ten. Add a name to the leaderboard."
      : "Try another run to climb higher."}`;
    answerForm.hidden = true;
    nameForm.hidden = !data.eligible;
    restartButton.hidden = false;
    showLeaders(data.leaderboard || []);
    if (data.eligible) nameInput.focus();
  }

  async function startGame() {
    if (busy) return;
    busy = true;
    showError("");
    startButton.disabled = true;
    restartButton.disabled = true;
    try {
      const data = await send({ action: "start" });
      sessionId = data.sessionId;
      showScore(0);
      beginRound(data);
    } catch (cause) {
      showError(cause.message);
    } finally {
      busy = false;
      startButton.disabled = false;
      restartButton.disabled = false;
    }
  }

  async function submitAnswer(value) {
    if (busy || !sessionId) return;
    busy = true;
    answerInput.disabled = true;
    answerForm.querySelector("button").disabled = true;
    showError("");
    field("result").textContent = value ? "Scoring your answer..." : "Time is up...";
    try {
      const data = await send({ action: "answer", sessionId, answer: value });
      if (data.retry) {
        field("result").textContent = `Try again. ${data.explanation}`;
        answerInput.value = "";
      } else {
        showScore(data.score);
        if (data.round === 7) finish(data);
        else beginRound(data, `${categoryLabel(data)}+${data.points} points. ${data.explanation}`);
      }
    } catch (cause) {
      showError(cause.message);
    } finally {
      busy = false;
      answerInput.disabled = false;
      answerForm.querySelector("button").disabled = false;
      if (!answerForm.hidden) answerInput.focus();
      if (!answerForm.hidden) tick();
    }
  }

  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", startGame);
  answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAnswer(answerInput.value.trim());
  });
  nameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    showError("");
    try {
      const data = await send({ action: "name", sessionId, name: nameInput.value });
      showLeaders(data.leaderboard);
      nameForm.hidden = true;
      field("result").textContent = "Your score is on the leaderboard.";
    } catch (cause) {
      showError(cause.message);
    } finally {
      busy = false;
    }
  });
  fetch(api).then((response) => response.json()).then((data) => showLeaders(data.leaderboard || []))
    .catch(() => showLeaders([]));
})();
