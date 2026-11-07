// LearnSpace page behavior
const lessons = window.LEARNSPACE_LESSONS;
const storageKey = "learnspace-completed-lessons";

const elements = {
  lessonGrid: document.querySelector("#lesson-grid"),
  lessonCatalog: document.querySelector("#lesson-catalog"),
  lessonView: document.querySelector("#lesson-view"),
  lessonSectionHeading: document.querySelector("#lessons-panel > .section-heading"),
  lessonTotal: document.querySelector("#lesson-total"),
  emptyState: document.querySelector("#empty-state"),
  searchInput: document.querySelector("#lesson-search"),
  filterButtons: [...document.querySelectorAll(".filter-chip")],
  tabButtons: [...document.querySelectorAll(".learning-tab")],
  quizSelect: document.querySelector("#quiz-lesson-select"),
  quizContent: document.querySelector("#quiz-content"),
  toast: document.querySelector("#toast"),
  progressPercent: document.querySelector("#progress-percent"),
  progressCount: document.querySelector("#progress-count"),
  progressRing: document.querySelector("#progress-ring"),
  progressMessage: document.querySelector("#progress-message"),
};

let activeFilter = "all";
let selectedLessonId = lessons[0].id;
let completedLessons = loadCompletedLessons();
let toastTimer;

// Persistence
function loadCompletedLessons() {
  try {
    const savedLessons = JSON.parse(localStorage.getItem(storageKey) || "[]");

    if (!Array.isArray(savedLessons)) {
      return [];
    }

    return [...new Set(
      savedLessons.filter((id) => lessons.some((lesson) => lesson.id === id)),
    )];
  } catch (error) {
    console.error("Could not read saved lesson progress.", error);
    return [];
  }
}

function saveCompletedLessons() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(completedLessons));
  } catch (error) {
    console.error("Could not save lesson progress.", error);
    showToast("Progress could not be saved in this browser.");
  }
}

// Shared DOM helpers
function makeElement(tag, className = "", text = "") {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function getLessonById(lessonId) {
  return lessons.find((lesson) => lesson.id === lessonId) || lessons[0];
}

// Lesson visuals
function renderWaterCycleVisual() {
  const sky = makeElement("div", "water-sky");
  sky.append(
    makeElement("span", "water-sun", "☀"),
    makeElement("span", "water-cloud", "☁"),
    makeElement("span", "water-drop", "💧"),
  );

  const steps = makeElement("div", "visual-steps");
  const cycleSteps = [
    ["1", "Evaporate"],
    ["2", "Condense"],
    ["3", "Precipitate"],
    ["4", "Collect"],
  ];

  cycleSteps.forEach(([number, label]) => {
    const step = makeElement("span", "visual-step");
    step.append(
      makeElement("b", "", number),
      makeElement("span", "", label),
    );
    steps.append(step);
  });

  return [sky, steps];
}

function renderFractionVisual() {
  const pie = makeElement("div", "fraction-pie");

  for (let index = 0; index < 4; index += 1) {
    const piece = makeElement(
      "span",
      index < 3 ? "fraction-piece filled" : "fraction-piece",
    );
    pie.append(piece);
  }

  return [
    pie,
    makeElement("strong", "fraction-number", "3 / 4"),
    makeElement("span", "fraction-caption", "3 of 4 equal parts"),
  ];
}

function renderNileVisual() {
  const landscape = makeElement("div", "egypt-landscape");
  landscape.append(
    makeElement("span", "egypt-sun", "☀"),
    makeElement("span", "egypt-pyramid pyramid-one"),
    makeElement("span", "egypt-pyramid pyramid-two"),
    makeElement("span", "egypt-field field-one"),
    makeElement("span", "egypt-field field-two"),
    makeElement("span", "egypt-river"),
    makeElement("span", "egypt-boat", "⛵"),
    makeElement("span", "egypt-label", "FERTILE FIELDS"),
  );

  return [landscape];
}

function renderSolarSystemVisual() {
  const diagram = makeElement("div", "solar-system-diagram");
  diagram.append(makeElement("span", "solar-system-sun", "Sun"));

  const planets = [
    ["Mercury", "planet-mercury"],
    ["Venus", "planet-venus"],
    ["Earth", "planet-earth"],
    ["Mars", "planet-mars"],
    ["Jupiter", "planet-jupiter"],
    ["Saturn", "planet-saturn"],
    ["Uranus", "planet-uranus"],
    ["Neptune", "planet-neptune"],
  ];

  planets.forEach(([name, className]) => {
    const orbit = makeElement("span", `planet-orbit ${className}`);
    orbit.setAttribute("aria-label", name);
    diagram.append(orbit);
  });

  const key = makeElement("div", "planet-key");
  planets.forEach(([name], index) => {
    key.append(makeElement("span", "", `${index + 1}. ${name}`));
  });

  return [diagram, key];
}

function renderMultiplicationVisual() {
  const array = makeElement("div", "multiplication-array");

  for (let row = 0; row < 3; row += 1) {
    const dotRow = makeElement("div", "multiplication-row");

    for (let column = 0; column < 4; column += 1) {
      dotRow.append(makeElement("span", "multiplication-dot"));
    }

    array.append(dotRow);
  }

  return [
    array,
    makeElement("strong", "multiplication-equation", "3 × 4 = 12"),
    makeElement("span", "multiplication-caption", "3 equal groups of 4"),
  ];
}

function renderRomeVisual() {
  const building = makeElement("div", "rome-building");
  building.append(
    makeElement("span", "rome-roof"),
    makeElement("span", "rome-attic"),
  );

  const columns = makeElement("div", "rome-columns");

  for (let index = 0; index < 6; index += 1) {
    columns.append(makeElement("span", "rome-column"));
  }

  building.append(columns, makeElement("span", "rome-steps"));
  return [building];
}

function renderLessonVisual(lesson, large = false) {
  const scene = makeElement(
    "div",
    `lesson-art ${lesson.subject}${large ? " lesson-art-large" : ""} visual-${lesson.visualType}`,
  );
  scene.setAttribute("role", "img");
  scene.setAttribute("aria-label", lesson.visualLabel);

  const visualRenderers = {
    "water-cycle": renderWaterCycleVisual,
    fractions: renderFractionVisual,
    nile: renderNileVisual,
    "solar-system": renderSolarSystemVisual,
    multiplication: renderMultiplicationVisual,
    rome: renderRomeVisual,
  };
  const renderVisual = visualRenderers[lesson.visualType];

  if (!renderVisual) {
    console.error(`Missing visual renderer for lesson type: ${lesson.visualType}`);
    return scene;
  }

  scene.append(...renderVisual());
  return scene;
}

// Lesson catalog and lesson details
function renderLessons() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const visibleLessons = lessons.filter((lesson) => {
    const matchesSubject = activeFilter === "all" || lesson.subject === activeFilter;
    const searchableText = [
      lesson.title,
      lesson.subjectLabel,
      lesson.description,
    ].join(" ").toLowerCase();

    return matchesSubject && searchableText.includes(query);
  });

  elements.lessonGrid.replaceChildren();
  elements.emptyState.hidden = visibleLessons.length > 0;

  visibleLessons.forEach((lesson) => {
    elements.lessonGrid.append(createLessonCard(lesson));
  });
}

function createLessonCard(lesson) {
  const card = makeElement("article", "lesson-card");
  const visual = renderLessonVisual(lesson);

  if (completedLessons.includes(lesson.id)) {
    visual.append(makeElement("span", "completed-badge", "✓ Completed"));
  }

  const info = makeElement("div", "lesson-info");
  const meta = makeElement("div", "lesson-meta");
  meta.append(
    makeElement("span", "subject-label", lesson.subjectLabel),
    makeElement("span", "", `◷ ${lesson.duration}`),
  );

  const action = makeElement("button", "lesson-action");
  action.type = "button";
  action.setAttribute("aria-label", `Open visual lesson: ${lesson.title}`);
  action.append(
    makeElement("span", "", "Explore visual lesson"),
    makeElement("span", "", "→"),
  );
  action.addEventListener("click", () => openLesson(lesson));

  info.append(
    meta,
    makeElement("h3", "", lesson.title),
    makeElement("p", "", lesson.description),
    action,
  );
  card.append(visual, info);

  return card;
}

function openLesson(lesson) {
  elements.lessonCatalog.hidden = true;
  elements.lessonView.hidden = false;
  elements.lessonSectionHeading.hidden = true;
  elements.lessonView.replaceChildren();

  const backButton = makeElement("button", "back-button", "← All lessons");
  backButton.type = "button";
  backButton.addEventListener("click", () => {
    elements.lessonCatalog.hidden = false;
    elements.lessonView.hidden = true;
    elements.lessonSectionHeading.hidden = false;
  });

  const heading = makeElement("div", "lesson-detail-heading");
  heading.append(
    makeElement("p", "eyebrow", `${lesson.subjectLabel} · ${lesson.duration}`),
    makeElement("h2", "", lesson.title),
    makeElement("p", "lesson-detail-description", lesson.description),
  );

  const story = createLessonStory(lesson);
  const quizButton = makeElement("button", "primary-button lesson-quiz-button");
  quizButton.type = "button";
  quizButton.append(
    makeElement("span", "", "Ready for a quick quiz?"),
    makeElement("span", "", "→"),
  );
  quizButton.addEventListener("click", () => {
    elements.quizSelect.value = lesson.id;
    selectLessonQuiz(lesson.id);
    setActiveTab("quiz");
  });

  const source = makeElement("p", "lesson-source");
  source.append(document.createTextNode("Learn more: "));
  const sourceLink = makeElement("a", "", lesson.source.name);
  sourceLink.href = lesson.source.url;
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  source.append(sourceLink);

  elements.lessonView.append(backButton, heading, story, quizButton, source);
  backButton.focus({ preventScroll: true });
}

function createLessonStory(lesson) {
  const story = makeElement("div", "lesson-story");
  const visualColumn = makeElement("div", "lesson-visual-column");
  visualColumn.append(
    renderLessonVisual(lesson, true),
    makeElement("p", "visual-caption", lesson.visualCaption),
  );

  const storyCopy = makeElement("div", "lesson-story-copy");
  storyCopy.append(makeElement("p", "eyebrow", "LEARN THE IDEA"));

  lesson.sections.forEach((section) => {
    const sectionElement = makeElement("section", "lesson-explainer");
    sectionElement.append(
      makeElement("h3", "", section.title),
      makeElement("p", "", section.text),
    );
    storyCopy.append(sectionElement);
  });

  storyCopy.append(createVocabulary(lesson.keyTerms));
  story.append(visualColumn, storyCopy);
  return story;
}

function createVocabulary(terms) {
  const vocabulary = makeElement("section", "key-terms");
  vocabulary.append(makeElement("h3", "", "Words to know"));
  const list = makeElement("dl");

  terms.forEach(([term, definition]) => {
    list.append(
      makeElement("dt", "", term),
      makeElement("dd", "", definition),
    );
  });

  vocabulary.append(list);
  return vocabulary;
}

// Quizzes
function renderQuiz() {
  const lesson = getLessonById(selectedLessonId);
  const card = makeElement("section", `quiz-card ${lesson.subject}`);
  card.setAttribute("aria-labelledby", "quiz-title");

  const heading = makeElement("div", "quiz-card-heading");
  heading.append(
    makeElement("p", "eyebrow", `${lesson.subjectLabel} · ${lesson.questions.length} questions`),
    makeElement("h3", "", lesson.title),
  );
  heading.querySelector("h3").id = "quiz-title";

  const form = document.createElement("form");
  const questionList = makeElement("div", "quiz-question-list");
  const feedback = makeElement("p", "quiz-feedback");
  feedback.setAttribute("aria-live", "polite");
  const submitButton = makeElement("button", "quiz-submit", "Check my answers");
  submitButton.type = "submit";

  const alreadyCompleted = completedLessons.includes(lesson.id);
  const completeButton = makeElement(
    "button",
    "quiz-complete",
    alreadyCompleted ? "Lesson completed ✓" : "Complete lesson",
  );
  completeButton.type = "button";
  completeButton.disabled = true;
  completeButton.addEventListener("click", () => completeLesson(lesson));

  const retryButton = makeElement("button", "quiz-retry", "Try the quiz again");
  retryButton.type = "button";
  retryButton.hidden = true;
  retryButton.addEventListener("click", () => renderQuiz());

  lesson.questions.forEach((question, questionIndex) => {
    questionList.append(createQuestion(question, questionIndex));
  });

  form.append(questionList, feedback, submitButton, completeButton, retryButton);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    checkQuizAnswers({
      lesson,
      form,
      feedback,
      submitButton,
      completeButton,
      retryButton,
    });
  });

  card.append(heading, form);
  elements.quizContent.replaceChildren(card);
}

function createQuestion(question, questionIndex) {
  const fieldset = makeElement("fieldset", "quiz-question-card");
  const legend = makeElement(
    "legend",
    "quiz-question",
    `${questionIndex + 1}. ${question.question}`,
  );
  const options = makeElement("div", "quiz-options");
  options.setAttribute("role", "radiogroup");
  options.setAttribute("aria-label", question.question);

  question.options.forEach((option, optionIndex) => {
    const label = makeElement("label", "quiz-option");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `answer-${questionIndex}`;
    input.value = String(optionIndex);
    label.append(input, makeElement("span", "", option));
    options.append(label);
  });

  fieldset.append(legend, options);
  return fieldset;
}

function checkQuizAnswers({
  lesson,
  form,
  feedback,
  submitButton,
  completeButton,
  retryButton,
}) {
  const selectedAnswers = lesson.questions.map((_, questionIndex) => (
    form.querySelector(`input[name="answer-${questionIndex}"]:checked`)
  ));
  const unansweredIndex = selectedAnswers.findIndex((answer) => !answer);

  if (unansweredIndex !== -1) {
    feedback.className = "quiz-feedback incorrect";
    feedback.textContent = `Please answer question ${unansweredIndex + 1} before checking.`;
    form.querySelector(`input[name="answer-${unansweredIndex}"]`).focus();
    return;
  }

  const score = selectedAnswers.reduce((total, selected, index) => (
    total + (Number(selected.value) === lesson.questions[index].answer ? 1 : 0)
  ), 0);

  lesson.questions.forEach((question, questionIndex) => {
    showQuestionFeedback(form, question, questionIndex, selectedAnswers[questionIndex]);
  });

  feedback.className = `quiz-feedback ${score === lesson.questions.length ? "correct" : ""}`;
  feedback.textContent = `You got ${score} out of ${lesson.questions.length} correct.`;
  submitButton.disabled = true;
  retryButton.hidden = false;
  completeButton.disabled = completedLessons.includes(lesson.id);

  if (!completeButton.disabled) {
    completeButton.textContent = `Complete lesson (${score}/${lesson.questions.length})`;
  }
}

function showQuestionFeedback(form, question, questionIndex, selectedAnswer) {
  const fieldset = form.querySelectorAll(".quiz-question-card")[questionIndex];
  const isCorrect = Number(selectedAnswer.value) === question.answer;
  const message = makeElement("p", `question-feedback ${isCorrect ? "correct" : "incorrect"}`);
  message.textContent = isCorrect
    ? "Correct!"
    : `The correct answer is: ${question.options[question.answer]}`;

  fieldset.append(message);
  fieldset.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
  });
}

function selectLessonQuiz(lessonId) {
  selectedLessonId = lessonId;
  elements.quizSelect.value = lessonId;
  renderQuiz();
}

// Tabs, filters, and navigation
function setActiveTab(tabName) {
  elements.tabButtons.forEach((button) => {
    const isSelected = button.dataset.tab === tabName;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
    button.tabIndex = isSelected ? 0 : -1;
    document.querySelector(`#${button.dataset.tab}-panel`).hidden = !isSelected;
  });

  if (tabName === "quiz") {
    renderQuiz();
  }

  document.querySelector("#lessons").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function bindLessonFilters() {
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;

      elements.filterButtons.forEach((filterButton) => {
        const isSelected = filterButton === button;
        filterButton.classList.toggle("selected", isSelected);
        filterButton.setAttribute("aria-pressed", String(isSelected));
      });

      renderLessons();
    });
  });

  elements.searchInput.addEventListener("input", renderLessons);
}

function bindTabs() {
  elements.tabButtons.forEach((button, index) => {
    button.tabIndex = button.dataset.tab === "lessons" ? 0 : -1;
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (
        index + direction + elements.tabButtons.length
      ) % elements.tabButtons.length;
      const nextTab = elements.tabButtons[nextIndex];

      nextTab.focus();
      setActiveTab(nextTab.dataset.tab);
    });
  });
}

function bindNavigation() {
  document.querySelectorAll('a[href="#lessons"]').forEach((link) => {
    link.addEventListener("click", () => {
      setActiveTab("lessons");
      elements.lessonCatalog.hidden = false;
      elements.lessonView.hidden = true;
      elements.lessonSectionHeading.hidden = false;
    });
  });

  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement.tagName;
    const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag);

    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      setActiveTab("lessons");
      elements.searchInput.focus();
    }
  });
}

function bindQuizPicker() {
  elements.quizSelect.replaceChildren(
    makeElement("option", "", "Choose a lesson"),
  );
  elements.quizSelect.firstElementChild.value = "";
  elements.quizSelect.firstElementChild.disabled = true;

  lessons.forEach((lesson) => {
    const option = makeElement("option", "", lesson.title);
    option.value = lesson.id;
    elements.quizSelect.append(option);
  });

  elements.quizSelect.value = selectedLessonId;
  elements.quizSelect.addEventListener("change", () => {
    selectLessonQuiz(elements.quizSelect.value);
  });
}

// Progress and notifications
function completeLesson(lesson) {
  if (completedLessons.includes(lesson.id)) {
    return;
  }

  completedLessons = [...completedLessons, lesson.id];
  saveCompletedLessons();
  updateProgress();
  renderLessons();
  renderQuiz();
  showToast("Lesson completed. Nice work! ✨");
}

function updateProgress() {
  const completedCount = completedLessons.length;
  const percentComplete = Math.round((completedCount / lessons.length) * 100);

  elements.progressPercent.textContent = `${percentComplete}%`;
  elements.progressCount.textContent = `${completedCount} / ${lessons.length}`;
  elements.progressRing.style.setProperty("--progress", `${percentComplete}%`);
  elements.progressRing.setAttribute(
    "aria-label",
    `${percentComplete} percent of lessons completed`,
  );
  elements.progressMessage.textContent = getProgressMessage(completedCount);
  elements.lessonTotal.textContent = String(lessons.length).padStart(2, "0");
}

function getProgressMessage(completedCount) {
  if (completedCount === lessons.length) {
    return "You've completed every lesson! 🎉";
  }

  if (completedCount > 0) {
    return "You're building a great habit ✨";
  }

  return "Your first win is waiting ✨";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2800);
}

function initializeLearnSpace() {
  bindLessonFilters();
  bindTabs();
  bindNavigation();
  bindQuizPicker();
  renderLessons();
  renderQuiz();
  updateProgress();
}

initializeLearnSpace();
