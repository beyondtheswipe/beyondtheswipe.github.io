const questions = {
  college: {
    prompt: "Do you want to go to college?",
    kind: "choice",
    options: ["Yes", "No", "Not sure yet"],
    next: (_answers, value) => (value === "Yes" ? "major" : "stableIncome"),
  },
  major: {
    prompt: "What is your intended major?",
    helper: "A career area is fine if you do not know the exact major yet.",
    kind: "text",
    placeholder: "Example: medical, business, computer science",
    next: () => "schoolYears",
  },
  schoolYears: {
    prompt: "How many years of schooling do you expect to undergo?",
    kind: "text",
    placeholder: "Example: 4 years, 8 years, 12 years",
    next: () => "scholarships",
  },
  scholarships: {
    prompt: "Do you have any scholarships?",
    kind: "choice",
    options: ["Yes", "No", "I plan to apply"],
    next: () => "paidPrograms",
  },
  paidPrograms: {
    prompt:
      "Have you done any programs outside of school that require money to be spent?",
    helper: "Think about camps, certification programs, clubs, trips, or lessons.",
    kind: "choice",
    options: ["Yes", "No"],
    next: () => "stableIncome",
  },
  stableIncome: {
    prompt: "Does your family have a stable income?",
    kind: "choice",
    options: ["Yes", "No", "Not sure"],
    next: (answers, value) => {
      if (answers.college === "Yes") {
        return value === "Yes" ? "familyHelp" : "saveStrategies";
      }

      return "aspireJob";
    },
  },
  familyHelp: {
    prompt: "Will they help you pay for college?",
    kind: "choice",
    options: ["Yes", "No", "Somewhat"],
    next: () => "hasJob",
  },
  saveStrategies: {
    prompt: "What current strategies are you using to save?",
    kind: "text",
    placeholder: "Example: saving birthday money, part-time job, scholarship list",
    next: () => "hasJob",
  },
  aspireJob: {
    prompt: "Do you aspire to work a job?",
    kind: "choice",
    options: ["Yes", "No", "Maybe"],
    next: () => "hasJob",
  },
  hasJob: {
    prompt:
      "Do you currently have a job or have a way to make money in high school?",
    kind: "choice",
    options: ["Yes", "No"],
    next: (_answers, value) =>
      value === "Yes" ? "earningsHabit" : "financialConfidence",
  },
  earningsHabit: {
    prompt:
      "Do you save your earnings in a bank account, or tend to spend it immediately?",
    kind: "choice",
    options: ["Save most of it", "Spend most of it", "A mix of both"],
    summary: "What do you usually do with your earnings?",
    next: () => "creditCard",
  },
  financialConfidence: {
    prompt: "Do you feel confident in your knowledge of financial literacy?",
    kind: "choice",
    options: ["Yes", "No", "A little"],
    next: () => "creditCard",
  },
  creditCard: {
    prompt: "Do you have a personal credit card?",
    kind: "choice",
    options: ["Yes", "No"],
    next: (_answers, value) => (value === "Yes" ? "trackSpending" : "shopping"),
  },
  trackSpending: {
    prompt: "If so, do you keep track of your spending?",
    kind: "choice",
    options: ["Yes", "No", "Sometimes"],
    next: () => "shopping",
  },
  shopping: {
    prompt: "What are you in charge of shopping for personally?",
    helper: "For example: clothes, snacks, gas, gifts, or paying when you go out.",
    kind: "text",
    placeholder: "I usually pay for...",
    next: () => "windfall",
  },
  windfall: {
    prompt: "If you received 500 dollars now, what would you do with it?",
    kind: "text",
    placeholder: "Example: put it in my bank account, save half, spend it",
    next: () => null,
  },
};

const stage = document.querySelector("#advisor-stage");
const answersTarget = document.querySelector("#advisor-answers");
const progressLabel = document.querySelector("#advisor-progress-label");
const progressValue = document.querySelector("#advisor-progress-value");
const progressBar = document.querySelector("#advisor-progress-bar");

let steps = [];
let currentId = "college";
let finished = false;
let advice = null;
let adviceLoading = false;
let adviceKey = "";

function buildAnswers() {
  return steps.reduce((result, step) => {
    result[step.id] = step.value;
    return result;
  }, {});
}

function includesAny(value, words) {
  const lower = (value || "").toLowerCase();
  return words.some((word) => lower.includes(word));
}

function parseYears(value) {
  const match = (value || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function generateFeedback(answers) {
  const feedback = [];
  const years = parseYears(answers.schoolYears);

  if (answers.college === "Yes") {
    if (
      includesAny(answers.major, ["medical", "medicine", "doctor", "nurse"]) ||
      (years !== null && years >= 8)
    ) {
      feedback.push(
        "Your college path may involve more than tuition. Plan for textbooks, lab fees, food, housing, transportation, test fees, and application costs.",
      );
    } else {
      feedback.push(
        "Start a college cost list that separates tuition from daily costs like books, meals, transportation, and supplies.",
      );
    }

    if (answers.scholarships === "No") {
      feedback.push(
        "Since you do not have scholarships yet, build a scholarship list and apply early to local, school, community, and major-specific opportunities.",
      );
    } else if (answers.scholarships === "I plan to apply") {
      feedback.push(
        "Turn your scholarship plan into a calendar with deadlines, essay drafts, recommendation requests, and FAFSA timing.",
      );
    }

    if (answers.familyHelp === "Yes" || answers.familyHelp === "Somewhat") {
      feedback.push(
        "Because family help may be part of the plan, talk about timing, how much support is realistic, FAFSA deadlines, and whether a 529 or savings account is involved.",
      );
    } else if (answers.stableIncome !== "Yes") {
      feedback.push(
        "If family support is uncertain, focus on scholarships, lower-cost college options, and a simple monthly savings goal.",
      );
    }

    if (answers.paidPrograms === "Yes") {
      feedback.push(
        "Keep tracking program fees and activity costs now. Those small planning habits will help when college expenses become more frequent.",
      );
    }
  } else {
    if (answers.aspireJob === "Yes" || answers.aspireJob === "Maybe") {
      feedback.push(
        "If a job is part of your next step, plan how each paycheck will be split before it arrives: spending, saving, and future goals.",
      );
    }

    feedback.push(
      "Even if college is not the current plan, strong money habits still matter for transportation, training, rent, food, and emergencies.",
    );
  }

  if (answers.hasJob === "Yes") {
    if (answers.earningsHabit === "Save most of it") {
      feedback.push(
        "It is good that you are already saving. Choose a specific goal for part of that money so the habit stays motivating.",
      );
    } else if (answers.earningsHabit === "Spend most of it") {
      feedback.push(
        "Try a simple paycheck split: save a small percentage first, then decide what is available for spending.",
      );
    } else {
      feedback.push(
        "Since your earnings are mixed between saving and spending, use a budget manager or notes app to set limits before each week starts.",
      );
    }
  } else if (answers.financialConfidence !== "Yes") {
    feedback.push(
      "A small job, paid task, or structured allowance can make financial literacy feel more real because you practice choices with your own money.",
    );
  }

  if (answers.creditCard === "Yes") {
    if (answers.trackSpending === "No") {
      feedback.push(
        "If you use a credit card, track every purchase and aim to pay the full balance on time so credit does not become surprise debt.",
      );
    } else {
      feedback.push(
        "Keep tracking credit card spending and compare it with your bank balance before each payment date.",
      );
    }
  } else {
    feedback.push(
      "Before opening a personal credit card, learn how interest, due dates, minimum payments, and credit scores work.",
    );
  }

  if (includesAny(answers.shopping, ["friend", "out", "restaurant", "food"])) {
    feedback.push(
      "Since you spend money socially, create a small going-out budget so fun spending does not quietly use money meant for bigger goals.",
    );
  } else if (answers.shopping) {
    feedback.push(
      "For the things you buy personally, compare prices and decide what counts as essential spending before you shop.",
    );
  }

  if (includesAny(answers.windfall, ["bank", "save", "account"])) {
    feedback.push(
      "Putting unexpected money into a bank account is a strong choice. Consider saving part for emergencies and part for a specific goal.",
    );
  } else if (answers.windfall) {
    feedback.push(
      "For unexpected money, try the 24-hour rule: wait before spending, then split it between saving, needs, and wants.",
    );
  }

  return feedback.slice(0, 7);
}

function buildSummary(answers) {
  if (answers.college === "Yes") {
    const major = answers.major ? ` for ${answers.major}` : "";
    return `You are thinking ahead about college${major}, so your strongest next step is to connect school costs, savings habits, and spending choices into one plan.`;
  }

  if (answers.hasJob === "Yes") {
    return "You already have money decisions to practice now, so the goal is to turn income into a simple system for saving, spending, and future needs.";
  }

  return "You are still shaping your next steps, so this is a good moment to build basic habits around spending awareness, saving, and future planning.";
}

function generateFallbackAdvice(answers) {
  return {
    source: "fallback",
    summary: buildSummary(answers),
    suggestions: generateFeedback(answers),
    disclaimer:
      "This guidance is educational and based on your answers. For major money decisions, talk with a trusted adult, counselor, or financial aid office.",
  };
}

function getAdviceApiUrl() {
  return window.BTS_ADVICE_API_URL || "/api/advice";
}

function normalizeAdvice(payload, fallback) {
  const suggestions = Array.isArray(payload?.suggestions)
    ? payload.suggestions.filter((item) => typeof item === "string" && item.trim())
    : [];

  if (!payload?.summary || !payload?.disclaimer || suggestions.length === 0) {
    return fallback;
  }

  return {
    source: payload.source === "ai" ? "ai" : "fallback",
    summary: payload.summary,
    suggestions,
    disclaimer: payload.disclaimer,
  };
}

async function requestAdvice() {
  const answers = buildAnswers();
  const fallback = generateFallbackAdvice(answers);
  const nextAdviceKey = JSON.stringify(answers);

  if (adviceLoading || adviceKey === nextAdviceKey) {
    return;
  }

  adviceLoading = true;
  adviceKey = nextAdviceKey;
  render();

  try {
    const response = await fetch(getAdviceApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      advice = fallback;
    } else {
      advice = normalizeAdvice(await response.json(), fallback);
    }
  } catch {
    advice = fallback;
  } finally {
    adviceLoading = false;
    render();
  }
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function updateProgress() {
  const progress = finished
    ? advice ? 100 : 96
    : Math.min(92, Math.round((steps.length / 11) * 100));
  progressLabel.textContent = finished
    ? advice ? "Feedback ready" : "Generating feedback"
    : `Question ${steps.length + 1}`;
  progressValue.textContent = `${progress}%`;
  progressBar.style.width = `${progress}%`;
}

function renderAnswers() {
  answersTarget.innerHTML = "";

  if (!steps.length) {
    answersTarget.append(
      createElement(
        "p",
        "empty-state",
        "Your responses will appear here as you move through the questions.",
      ),
    );
    return;
  }

  const list = createElement("ol", "answer-list");
  steps.forEach((step) => {
    const item = document.createElement("li");
    item.append(createElement("span", "", questions[step.id].summary || questions[step.id].prompt));
    item.append(createElement("strong", "", step.value));
    list.append(item);
  });
  answersTarget.append(list);
}

function commitAnswer(value) {
  const cleanValue = value.trim();
  if (!cleanValue) {
    return;
  }

  const question = questions[currentId];
  steps = [...steps, { id: currentId, value: cleanValue }];
  const nextId = question.next(buildAnswers(), cleanValue);

  if (nextId) {
    currentId = nextId;
    finished = false;
  } else {
    finished = true;
    advice = null;
    adviceKey = "";
  }

  render();
}

function goBack() {
  const previous = steps[steps.length - 1];
  if (!previous) {
    return;
  }

  steps = steps.slice(0, -1);
  currentId = previous.id;
  finished = false;
  advice = null;
  adviceLoading = false;
  adviceKey = "";
  render(previous.value);
}

function restart() {
  steps = [];
  currentId = "college";
  finished = false;
  advice = null;
  adviceLoading = false;
  adviceKey = "";
  render();
}

function renderQuestion(draftValue = "") {
  const question = questions[currentId];
  stage.innerHTML = "";

  const panel = createElement("div", "question-panel");
  panel.append(createElement("p", "advisor-kicker", "AI-powered money checkup"));
  panel.append(createElement("h2", "", question.prompt));

  if (question.helper) {
    panel.append(createElement("p", "question-helper", question.helper));
  }

  if (question.kind === "choice") {
    const list = createElement("div", "choice-list");
    question.options.forEach((option) => {
      const button = createElement("button", "choice-button", option);
      button.type = "button";
      button.addEventListener("click", () => commitAnswer(option));
      list.append(button);
    });
    panel.append(list);
  } else {
    const form = createElement("form", "text-answer-form");
    const textarea = createElement("textarea", "text-answer");
    textarea.rows = 4;
    textarea.placeholder = question.placeholder || "";
    textarea.value = draftValue;

    const submit = createElement("button", "cta-button", "Continue ->");
    submit.type = "submit";
    submit.disabled = !textarea.value.trim();
    textarea.addEventListener("input", () => {
      submit.disabled = !textarea.value.trim();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      commitAnswer(textarea.value);
    });

    form.append(textarea, submit);
    panel.append(form);
  }

  const actions = createElement("div", "advisor-actions");
  const back = createElement("button", "secondary-button", "Back");
  back.type = "button";
  back.disabled = !steps.length;
  back.addEventListener("click", goBack);

  const restartButton = createElement("button", "secondary-button", "Restart");
  restartButton.type = "button";
  restartButton.addEventListener("click", restart);

  actions.append(back, restartButton);
  panel.append(actions);
  stage.append(panel);
}

function renderFeedback() {
  stage.innerHTML = "";

  const panel = createElement("div", "feedback-panel");

  if (!advice) {
    panel.append(createElement("p", "advisor-kicker", "AI personalized feedback"));
    panel.append(createElement("h2", "", "Generating your advice"));
    panel.append(
      createElement(
        "p",
        "feedback-note",
        "We are reviewing your answers and preparing student-friendly money suggestions.",
      ),
    );
    stage.append(panel);
    return;
  }

  panel.append(
    createElement(
      "p",
      "advisor-kicker",
      advice.source === "ai" ? "AI personalized feedback" : "Guided feedback",
    ),
  );
  panel.append(createElement("h2", "", "Your next money moves"));
  panel.append(createElement("p", "feedback-summary", advice.summary));

  const list = createElement("ul", "feedback-list");
  advice.suggestions.forEach((item) => {
    list.append(createElement("li", "", item));
  });

  panel.append(list);
  panel.append(createElement("p", "feedback-note", advice.disclaimer));

  const actions = createElement("div", "advisor-actions");
  const back = createElement("button", "secondary-button", "Change last answer");
  back.type = "button";
  back.addEventListener("click", goBack);

  const restartButton = createElement("button", "cta-button", "Start over");
  restartButton.type = "button";
  restartButton.addEventListener("click", restart);

  actions.append(back, restartButton);
  panel.append(actions);
  stage.append(panel);
}

function render(draftValue = "") {
  updateProgress();
  renderAnswers();

  if (finished) {
    requestAdvice();
    renderFeedback();
  } else {
    renderQuestion(draftValue);
  }
}

render();
