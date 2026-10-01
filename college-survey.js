const COLLEGE_SURVEY_API_BASE =
  window.BTS_API_BASE || "https://beyond-the-swipe.liqiangz.workers.dev";

const collegeSurveyQuestions = [
  { id: "name", prompt: "What is your first and last name?", kind: "text", placeholder: "First and last name", helper: "Your response is stored privately. Research findings will be reported anonymously." },
  { id: "college", prompt: "What college do you attend or did you attend?", kind: "text", placeholder: "College or university" },
  { id: "major", prompt: "What is your intended major or field of interest?", kind: "choice", options: ["Business", "Healthcare & Medicine", "Engineering", "Computer Science & Technology", "Natural Sciences", "Mathematics", "Social Sciences", "Humanities", "Arts & Design", "Communications & Media", "Education", "Agriculture & Environmental Science", "Architecture & Planning", "Law & Public Service", "Languages & Global Studies"], allowOther: true },
  { id: "freeTime", prompt: "On an average day, how many hours of free or unstructured time do you have?", kind: "choice", options: ["Less than 1 hour", "1 hour", "2 hours", "3 hours", "4 hours"], allowOther: true },
  { id: "shoppingTime", prompt: "Of that free time, how much is spent browsing or shopping online, even without buying?", kind: "choice", options: ["Less than 1 hour", "1 hour", "2 hours", "3 hours", "4 hours"], allowOther: true },
  { id: "stressSpending", prompt: "Do you notice a connection between boredom or stress and spending?", kind: "choice", options: ["Yes", "No"] },
  { id: "moneyTalk", prompt: "How easy do you find it to talk about money with friends or family?", kind: "scale", options: ["1", "2", "3", "4", "5"], scaleLabels: ["Very difficult", "Very easy"] },
  { id: "savingConfidence", prompt: "How confident do you feel about your ability to save money?", kind: "scale", options: ["1", "2", "3", "4", "5"], scaleLabels: ["Not confident", "Very confident"] },
  { id: "spendingConfidence", prompt: "How confident do you feel about your ability to spend responsibly?", kind: "scale", options: ["1", "2", "3", "4", "5"], scaleLabels: ["Not confident", "Very confident"] },
  { id: "adviceSource", prompt: "Which do you use more for financial advice?", kind: "choice", options: ["Printed materials", "Social media resources"], helper: "Choose between a bank's printed materials and a social media influencer or creator." },
  { id: "discretionarySpending", prompt: "Roughly how much of your monthly budget goes to discretionary, non-essential items?", kind: "choice", options: ["Less than 1%", "1%-5%", "5%-10%", "10%-20%", "More than 20%"], helper: "Make your best estimate." },
  { id: "trackingMethod", prompt: "How do you currently track your spending?", kind: "choice", options: ["App", "Spreadsheet", "Mental estimate", "Not at all"], allowOther: true },
  { id: "strengths", prompt: "What are your strengths when it comes to managing your personal finances?", kind: "multi", options: ["Saving money", "Budgeting and tracking expenses", "Investing and growing wealth", "Paying bills and managing debt responsibly"], allowOther: true, helper: "Select all that apply." },
  { id: "weaknesses", prompt: "What are your biggest weaknesses when it comes to managing your personal finances?", kind: "multi", options: ["Saving money", "Budgeting and tracking expenses", "Investing and growing wealth", "Paying bills and managing debt responsibly"], allowOther: true, helper: "Select all that apply." },
  { id: "schoolResources", prompt: "Does your school have financial clubs or resources that are easy for you to access? If so, what are they?", kind: "text", placeholder: "Tell us about the resources, or enter None" },
];

const collegeSurveyRoot = document.querySelector("[data-college-survey]");

if (collegeSurveyRoot) {
  const stage = document.querySelector("#college-survey-stage");
  const answersTarget = document.querySelector("#college-survey-answers");
  const progressLabel = document.querySelector("#college-progress-label");
  const progressValue = document.querySelector("#college-progress-value");
  const progressBar = document.querySelector("#college-progress-bar");
  let questionIndex = 0;
  let answers = {};
  let selected = [];
  let otherOpen = false;
  let status = "answering";
  let submissionId = createSubmissionId();

  function createSubmissionId() {
    return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatAnswer(value) {
    return Array.isArray(value) ? value.join(", ") : value;
  }

  function updateProgress() {
    const complete = status === "complete";
    const progress = complete ? 100 : Math.round((questionIndex / collegeSurveyQuestions.length) * 100);
    progressLabel.textContent = complete ? "Response recorded" : `Question ${questionIndex + 1} of ${collegeSurveyQuestions.length}`;
    progressValue.textContent = `${progress}%`;
    progressBar.style.width = `${progress}%`;
  }

  function renderAnswers() {
    answersTarget.innerHTML = "";
    const count = status === "complete" ? collegeSurveyQuestions.length : questionIndex;
    if (!count) {
      answersTarget.append(element("p", "empty-state", "Your responses will appear here as you move through the survey."));
      return;
    }
    const list = element("ol", "answer-list");
    collegeSurveyQuestions.slice(0, count).forEach((question) => {
      const item = document.createElement("li");
      item.append(element("span", "", question.prompt));
      item.append(element("strong", "", formatAnswer(answers[question.id])));
      list.append(item);
    });
    answersTarget.append(list);
  }

  async function submitSurvey() {
    status = "submitting";
    render();
    try {
      const response = await fetch(`${COLLEGE_SURVEY_API_BASE}/api/college-survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, submissionId, website: "" }),
      });
      if (!response.ok) throw new Error("Submission failed");
      status = "complete";
    } catch {
      status = "error";
    }
    render();
  }

  function commitAnswer(value) {
    const cleanValue = Array.isArray(value)
      ? value.map((item) => item.trim()).filter(Boolean)
      : value.trim();
    if (!cleanValue || (Array.isArray(cleanValue) && !cleanValue.length)) return;
    answers[collegeSurveyQuestions[questionIndex].id] = cleanValue;
    selected = [];
    otherOpen = false;
    status = "answering";
    if (questionIndex === collegeSurveyQuestions.length - 1) {
      submitSurvey();
    } else {
      questionIndex += 1;
      render();
    }
  }

  function goBack() {
    if (!questionIndex || status === "submitting") return;
    questionIndex -= 1;
    status = "answering";
    const current = answers[collegeSurveyQuestions[questionIndex].id];
    selected = Array.isArray(current) ? current.filter((item) => !item.startsWith("Other: ")) : [];
    otherOpen = Array.isArray(current)
      ? current.some((item) => item.startsWith("Other: "))
      : typeof current === "string" && current.startsWith("Other: ");
    render();
  }

  function restart() {
    questionIndex = 0;
    answers = {};
    selected = [];
    otherOpen = false;
    status = "answering";
    submissionId = createSubmissionId();
    render();
  }

  function renderOtherForm(panel, question) {
    const form = element("form", "text-answer-form survey-other-form");
    const label = element("label", "", "Please specify");
    const textarea = element("textarea", "text-answer");
    const prior = answers[question.id];
    const other = Array.isArray(prior)
      ? prior.find((item) => item.startsWith("Other: "))
      : typeof prior === "string" && prior.startsWith("Other: ") ? prior : "";
    textarea.value = other ? other.slice(7) : "";
    textarea.rows = 3;
    textarea.id = `college-other-${question.id}`;
    label.htmlFor = textarea.id;
    const submit = element("button", "cta-button", "Continue ->");
    submit.type = "submit";
    submit.disabled = !textarea.value.trim();
    textarea.addEventListener("input", () => { submit.disabled = !textarea.value.trim(); });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      commitAnswer(question.kind === "multi" ? [...selected, `Other: ${textarea.value.trim()}`] : `Other: ${textarea.value.trim()}`);
    });
    form.append(label, textarea, submit);
    panel.append(form);
  }

  function renderQuestion() {
    const question = collegeSurveyQuestions[questionIndex];
    const panel = element("div", "question-panel");
    panel.append(element("p", "advisor-kicker", "College student survey"));
    panel.append(element("h2", "", question.prompt));
    if (question.helper) panel.append(element("p", "question-helper", question.helper));

    if (question.kind === "text") {
      const form = element("form", "text-answer-form");
      const textarea = element("textarea", "text-answer");
      textarea.value = typeof answers[question.id] === "string" ? answers[question.id] : "";
      textarea.placeholder = question.placeholder || "";
      textarea.rows = question.id === "schoolResources" ? 5 : 3;
      textarea.autocomplete = question.id === "name" ? "name" : "off";
      const submit = element("button", "cta-button", "Continue ->");
      submit.type = "submit";
      submit.disabled = !textarea.value.trim();
      textarea.addEventListener("input", () => { submit.disabled = !textarea.value.trim(); });
      form.addEventListener("submit", (event) => { event.preventDefault(); commitAnswer(textarea.value); });
      form.append(textarea, submit);
      panel.append(form);
    } else {
      const list = element("div", `choice-list${question.kind === "scale" ? " scale-choice-list" : ""}${question.kind === "multi" ? " survey-multi-list" : ""}`);
      question.options.forEach((option) => {
        const button = element("button", "choice-button", option);
        button.type = "button";
        if (question.kind === "multi") {
          button.setAttribute("aria-pressed", String(selected.includes(option)));
          button.addEventListener("click", () => {
            selected = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
            render();
          });
        } else {
          button.addEventListener("click", () => commitAnswer(option));
        }
        list.append(button);
      });
      if (question.allowOther) {
        const other = element("button", "choice-button", "Other");
        other.type = "button";
        other.setAttribute("aria-pressed", String(otherOpen));
        other.addEventListener("click", () => { otherOpen = question.kind === "multi" ? !otherOpen : true; render(); });
        list.append(other);
      }
      panel.append(list);
      if (question.scaleLabels) {
        const labels = element("div", "scale-labels");
        labels.append(element("span", "", question.scaleLabels[0]), element("span", "", question.scaleLabels[1]));
        panel.append(labels);
      }
      if (question.kind === "multi" && !otherOpen) {
        const continueButton = element("button", "cta-button survey-continue", "Continue ->");
        continueButton.type = "button";
        continueButton.disabled = !selected.length;
        continueButton.addEventListener("click", () => commitAnswer(selected));
        panel.append(continueButton);
      }
      if (otherOpen) renderOtherForm(panel, question);
    }

    if (status === "submitting") panel.append(element("p", "survey-status", "Saving your response..."));
    if (status === "error") {
      const error = element("div", "survey-error");
      error.setAttribute("role", "alert");
      error.append(element("p", "", "We could not save your response. Your answers are still here."));
      const retry = element("button", "cta-button", "Try again");
      retry.type = "button";
      retry.addEventListener("click", submitSurvey);
      error.append(retry);
      panel.append(error);
    }

    const actions = element("div", "advisor-actions");
    const back = element("button", "secondary-button", "Back");
    back.type = "button";
    back.disabled = !questionIndex || status === "submitting";
    back.addEventListener("click", goBack);
    const reset = element("button", "secondary-button", "Restart");
    reset.type = "button";
    reset.disabled = status === "submitting";
    reset.addEventListener("click", restart);
    actions.append(back, reset);
    panel.append(actions);
    stage.append(panel);
  }

  function renderComplete() {
    const panel = element("div", "feedback-panel");
    panel.append(element("p", "advisor-kicker", "Thank you"));
    panel.append(element("h2", "", "Your response has been recorded."));
    panel.append(element("p", "feedback-note", "Your input will help us understand how financial literacy programs can better reach students."));
    const actions = element("div", "advisor-actions");
    const reset = element("button", "cta-button", "Submit another response");
    reset.type = "button";
    reset.addEventListener("click", restart);
    actions.append(reset);
    panel.append(actions);
    stage.append(panel);
  }

  function render() {
    stage.innerHTML = "";
    updateProgress();
    renderAnswers();
    if (status === "complete") renderComplete();
    else renderQuestion();
  }

  render();
}
