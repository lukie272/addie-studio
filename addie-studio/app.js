const els = {
  topicInput: document.getElementById("topicInput"),
  learnerInput: document.getElementById("learnerInput"),
  brandInput: document.getElementById("brandInput"),
  deliveryInput: document.getElementById("deliveryInput"),
  startButton: document.getElementById("startButton"),
  progressTitle: document.getElementById("progressTitle"),
  progressPercent: document.getElementById("progressPercent"),
  progressBar: document.getElementById("progressBar"),
  stepsList: document.getElementById("stepsList"),
  courseOutput: document.getElementById("courseOutput"),
  evidenceOutput: document.getElementById("evidenceOutput"),
  copyButton: document.getElementById("copyButton"),
  exportButton: document.getElementById("exportButton"),
};

const steps = [
  "Read the training idea",
  "Search for published evidence",
  "Extract useful findings",
  "Analyse the training need",
  "Draft the course",
  "Prepare review and evaluation",
];

let activeTab = "course";
let lastEvidence = [];

function setProgress(index, title) {
  const percent = Math.round((index / steps.length) * 100);
  els.progressTitle.textContent = title;
  els.progressPercent.textContent = `${percent}%`;
  els.progressBar.style.width = `${percent}%`;
  els.stepsList.innerHTML = steps
    .map((step, stepIndex) => `<li class="${stepIndex < index ? "done" : ""}">${step}</li>`)
    .join("");
}

function invertAbstract(index) {
  if (!index) return "";
  const words = [];
  Object.entries(index).forEach(([word, positions]) => {
    positions.forEach((position) => {
      words[position] = word;
    });
  });
  return words.filter(Boolean).join(" ");
}

function cleanText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

function searchQuery(topic) {
  return `${topic} clinical education training guideline competency safety`;
}

async function fetchEvidence(topic) {
  const params = new URLSearchParams({
    search: searchQuery(topic),
    per_page: "8",
    sort: "relevance_score:desc",
  });
  const url = `https://api.openalex.org/works?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Evidence search failed");
  }
  const data = await response.json();
  return (data.results || []).map((work) => {
    const abstract = cleanText(invertAbstract(work.abstract_inverted_index)).slice(0, 650);
    const authors = (work.authorships || [])
      .slice(0, 4)
      .map((item) => item.author?.display_name)
      .filter(Boolean)
      .join(", ");
    const source = work.primary_location?.source?.display_name || "Source not listed";
    const link = work.doi ? `https://doi.org/${work.doi.replace("https://doi.org/", "")}` : work.id;
    return {
      title: cleanText(work.title) || "Untitled source",
      year: work.publication_year || "Year not listed",
      authors: authors || "Authors not listed",
      source,
      link,
      citedBy: work.cited_by_count || 0,
      abstract,
    };
  });
}

function fallbackEvidence(topic) {
  return [
    {
      title: `Evidence search could not be completed for "${topic}"`,
      year: "Check required",
      authors: "ADDIE Studio",
      source: "Offline fallback",
      link: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(topic)}`,
      citedBy: 0,
      abstract:
        "The browser could not complete the live evidence search. Use the PubMed link to check current sources, then rerun when internet access is available.",
    },
  ];
}

function evidenceThemes(evidence) {
  const text = evidence.map((item) => `${item.title} ${item.abstract}`).join(" ").toLowerCase();
  const themes = [];
  [
    ["safety", "patient safety and risk control"],
    ["competenc", "competency assessment"],
    ["simulation", "simulation or supervised practice"],
    ["education", "education and training"],
    ["guideline", "guideline or protocol alignment"],
    ["infection", "infection prevention"],
    ["documentation", "documentation"],
    ["confidence", "learner confidence"],
    ["knowledge", "knowledge improvement"],
  ].forEach(([needle, label]) => {
    if (text.includes(needle)) themes.push(label);
  });
  return themes.length ? themes : ["safe practice", "clear guidance", "supervised learning"];
}

function makeEvidenceMarkdown(evidence) {
  return evidence
    .map((item, index) => {
      const abstract = item.abstract || "No abstract snippet available.";
      return `${index + 1}. ${item.title}
   ${item.authors}. ${item.source}, ${item.year}. Cited by ${item.citedBy}.
   ${item.link}
   ${abstract}`;
    })
    .join("\n\n");
}

function makeCourse(topic, learners, delivery, evidence) {
  const audience = learners || "the target clinical learners";
  const mode = delivery === "Not sure yet" ? "a practical format chosen by the educator" : delivery;
  const themes = evidenceThemes(evidence);
  const evidenceList = makeEvidenceMarkdown(evidence);

  return `# ${topic}

## Evidence Found
ADDIE Studio searched for published evidence related to:
${searchQuery(topic)}

Key themes detected:
${themes.map((theme) => `- ${theme}`).join("\n")}

Sources to review:
${evidenceList}

## Package Contents
- Course overview
- Evidence summary
- Analysis summary
- Learning goals and performance objectives
- Educator/facilitator guide
- Learner guide
- Session plan
- Practice activity and scenario
- Skills/competency checklist
- Knowledge check
- Implementation checklist
- Evaluation forms and improvement plan

## 1. Analysis: What The Training Needs To Solve
This course is for ${audience}. The evidence search suggests the course should focus on safe practice, clear decision-making, consistent standards, and transfer into clinical work.

Likely learner needs:
- Understand the current evidence and local expectations.
- Know when to proceed, pause, escalate, or seek supervision.
- Practise the skill or process in a safe learning environment.
- Receive clear feedback against a consistent standard.
- Connect training to documentation, communication, complications, and patient safety.

Clinical safety checks before use:
- Confirm the evidence sources are current and relevant.
- Check local policy, scope of practice, and credentialing requirements.
- Ask a clinical subject matter expert to review the final content.

Performance gap to confirm:
- What do learners currently do?
- What should safe, competent practice look like?
- What prevents the desired performance: knowledge, skill, confidence, equipment, policy clarity, supervision, or workflow?

Learner and context questions:
- What prior experience do learners have?
- Where will they use the skill or knowledge?
- What supervision or sign-off is required?
- What local policy, equipment, or documentation system applies?

## 2. Design: Course Plan
Delivery format: ${mode}

Learning goals:
1. Explain the key safety principles and evidence behind ${topic}.
2. Identify indications, contraindications, risks, and escalation points.
3. Prepare the patient, equipment, environment, and documentation correctly.
4. Demonstrate the required clinical process using a structured checklist.
5. Reflect on performance and identify further supervised practice needs.

Suggested flow:
| Part | Purpose | Activity |
| --- | --- | --- |
| Evidence overview | Explain why the training matters | Short discussion using the sources found |
| Safe practice standard | Make expectations clear | Walk through local policy or checklist |
| Demonstration | Show the correct process | Facilitator demonstration with narration |
| Practice | Build confidence and consistency | Supervised practice or simulation |
| Scenario | Test judgement | Complication or escalation case |
| Review | Confirm readiness | Checklist, feedback, and next steps |

Performance objectives:
1. Given a relevant patient or clinical scenario, the learner identifies whether ${topic.toLowerCase()} is appropriate and names key risks.
2. Given local policy or procedure guidance, the learner prepares the patient, equipment, environment, and documentation correctly.
3. During supervised practice, the learner performs the required steps in the correct sequence.
4. When presented with a complication or uncertainty, the learner pauses, escalates, and documents appropriately.
5. After practice, the learner identifies what further supervision or experience is required before independent practice.

Assessment strategy:
- Knowledge check before or after teaching.
- Observed practice using the skills checklist.
- Scenario discussion to test judgement and escalation.
- Reflection prompt to identify ongoing supervised practice needs.

## 3. Development: Training Resources
### Educator Guide
Purpose:
Deliver a concise, evidence-informed session that prepares learners for safe practice and supervised assessment.

Facilitator notes:
- Start with why this matters for patient safety.
- Show the evidence themes and connect them to local practice.
- Demonstrate the process slowly and name the decision points.
- Use the same checklist for practice and assessment.
- Separate early practice from formal assessment where possible.

Educator preparation:
- Review the sources listed in the evidence summary.
- Confirm the most current local policy and scope of practice.
- Prepare any equipment, forms, task trainers, or simulation resources.
- Decide whether this session is education only or includes competency sign-off.
- Prepare a remediation plan for learners who are not yet ready.

### Learner Guide
Learner handout sections:
- Why this topic matters.
- Key evidence points.
- Local policy or procedure summary.
- Step-by-step practice checklist.
- Complications and escalation.
- Documentation requirements.
- Reflection and supervised practice plan.

### Session Plan
| Time | Activity | Educator Role | Learner Output |
| --- | --- | --- | --- |
| 0-10 min | Welcome and purpose | Explain why the training matters | States personal learning goal |
| 10-25 min | Evidence and policy overview | Link sources to local expectations | Identifies key safety points |
| 25-40 min | Demonstration | Model the process and decision points | Notes critical steps |
| 40-75 min | Supervised practice | Coach using checklist | Completes guided practice |
| 75-95 min | Scenario | Facilitate discussion | Explains escalation/documentation |
| 95-110 min | Assessment or review | Observe and give feedback | Receives next-step plan |
| 110-120 min | Close | Confirm follow-up requirements | Completes reflection |

### Practice Scenario
A learner is asked to complete or support ${topic.toLowerCase()} in a busy clinical area. The patient situation changes, and the learner must decide whether to proceed, pause, escalate, or seek help.

Questions:
1. What information must be checked first?
2. What finding would make this unsafe?
3. What does the evidence or policy suggest?
4. Who should be contacted if there is concern?
5. What needs to be documented?

### Skills And Competency Checklist
| Item | Achieved | Needs Practice | Notes |
| --- | --- | --- | --- |
| Confirms patient identity, indication, and consent |  |  |  |
| Checks contraindications, risks, and local policy requirements |  |  |  |
| Prepares equipment and environment safely |  |  |  |
| Communicates clearly with patient and team |  |  |  |
| Performs the required steps in sequence |  |  |  |
| Maintains infection prevention and safety principles |  |  |  |
| Recognises complications or uncertainty |  |  |  |
| Escalates appropriately |  |  |  |
| Documents care accurately |  |  |  |
| States follow-up or supervision requirements |  |  |  |

### Knowledge Check
1. What are the main patient safety risks related to ${topic.toLowerCase()}?
2. What local policy or guideline must be checked before practice?
3. What finding would make you pause or escalate?
4. What equipment, environment, or preparation is required?
5. What documentation is required after completion?

Answer guide:
- Answers should align with the evidence summary, local policy, scope of practice, and clinical escalation pathway.
- Any unsafe or uncertain answer should lead to supervised practice or remediation before sign-off.

## 4. Implementation: Delivery Plan
Before delivery:
- Confirm the evidence and local policy.
- Prepare the checklist, teaching notes, and scenario.
- Identify required equipment or simulation resources.
- Brief facilitators on the expected standard.
- Tell learners what to prepare and whether assessment is included.

Suggested session:
- 10 minutes: purpose, evidence, and risks.
- 20 minutes: key principles and local standard.
- 20 minutes: demonstration.
- 40 minutes: supervised practice or scenario work.
- 20 minutes: assessment, feedback, and next steps.

Implementation checklist:
| Task | Owner | Complete |
| --- | --- | --- |
| Evidence reviewed and dated |  |  |
| Local policy checked |  |  |
| Clinical reviewer approved content |  |  |
| Facilitator brief completed |  |  |
| Equipment/resources prepared |  |  |
| Learner communication sent |  |  |
| Assessment process confirmed |  |  |
| Feedback and evaluation forms ready |  |  |

## 5. Evaluation: Review Plan
Use simple measures:
- Confidence before and after training.
- Short knowledge check.
- Observed skill or decision-making checklist.
- Learner feedback on clarity and usefulness.
- Follow-up supervisor feedback after clinical practice.

Questions to ask after the course:
- What part helped learners most?
- What remained unclear?
- Did the course prepare learners for safe practice?
- What should be changed before the next group?

Learner feedback form:
| Question | Response |
| --- | --- |
| The training was relevant to my clinical role | 1 2 3 4 5 |
| I understand the key safety risks | 1 2 3 4 5 |
| I know when to escalate | 1 2 3 4 5 |
| I know what further supervised practice I need | 1 2 3 4 5 |
| The session was clear and practical | 1 2 3 4 5 |

Post-course improvement log:
| Finding | Evidence | Change Required | Owner | Due Date |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Important Review Note
This is a first draft based on an automated evidence search. It should be reviewed by a clinician, educator, or subject matter expert before it is used for patient-facing clinical training.`;
}

function renderEvidence(evidence) {
  els.evidenceOutput.innerHTML = evidence
    .map(
      (item) => `
        <article class="evidence-card">
          <h3>${item.title}</h3>
          <p class="meta">${item.authors} · ${item.source} · ${item.year} · cited by ${item.citedBy}</p>
          <p>${item.abstract || "No abstract snippet available."}</p>
          <a href="${item.link}" target="_blank" rel="noreferrer">Open source</a>
        </article>
      `,
    )
    .join("");
}

async function runStudio() {
  const topic = cleanText(els.topicInput.value);
  const learners = cleanText(els.learnerInput.value);
  const delivery = els.deliveryInput.value;

  if (!topic) {
    els.topicInput.focus();
    els.courseOutput.value = "Type the training you want to create, then start again.";
    return;
  }

  els.startButton.disabled = true;
  els.courseOutput.value = "";
  els.evidenceOutput.innerHTML = "";

  try {
    setProgress(1, "Reading the training idea");
    await wait(350);
    setProgress(2, "Searching for evidence");
    let evidence = await fetchEvidence(topic);
    if (!evidence.length) evidence = fallbackEvidence(topic);
    lastEvidence = evidence;

    setProgress(3, "Extracting useful findings");
    renderEvidence(evidence);
    await wait(350);

    setProgress(4, "Analysing the training need");
    await wait(350);

    setProgress(5, "Drafting the course");
    els.courseOutput.value = makeCourse(topic, learners, delivery, evidence);
    await wait(350);

    setProgress(6, "Course draft ready");
  } catch (error) {
    const evidence = fallbackEvidence(topic);
    lastEvidence = evidence;
    renderEvidence(evidence);
    els.courseOutput.value = makeCourse(topic, learners, delivery, evidence);
    setProgress(6, "Draft ready, evidence search needs checking");
  } finally {
    els.startButton.disabled = false;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  els.courseOutput.hidden = tab !== "course";
  els.evidenceOutput.hidden = tab !== "evidence";
}

function copyActive() {
  const text =
    activeTab === "course"
      ? els.courseOutput.value
      : lastEvidence.map((item) => `${item.title}\n${item.link}`).join("\n\n");
  navigator.clipboard.writeText(text || "");
}

function escapeHtml(value) {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(value) {
  return (value || "addie-course")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function documentShell({ title, topic, brand, body }) {
  const safeTitle = escapeHtml(title);
  const safeTopic = escapeHtml(topic);
  const safeBrand = escapeHtml(brand);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700;800&display=swap");
    :root {
      --ink: #17201b;
      --muted: #5f6d66;
      --line: #d9dfdc;
      --soft: #f4f7f5;
      --accent: #12695f;
      --accent-2: #b43f2d;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: #edf2ef;
      font-family: "Noto Sans", Arial, sans-serif;
      line-height: 1.5;
    }
    .page {
      width: min(960px, calc(100% - 32px));
      margin: 24px auto;
      padding: 36px;
      background: white;
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .doc-header {
      display: grid;
      grid-template-columns: 58px 1fr;
      gap: 16px;
      align-items: center;
      padding-bottom: 22px;
      border-bottom: 4px solid var(--accent);
      margin-bottom: 28px;
    }
    .mark {
      display: grid;
      place-items: center;
      width: 58px;
      height: 58px;
      border-radius: 8px;
      background: var(--accent);
      color: white;
      font-size: 1.4rem;
      font-weight: 800;
    }
    .brand { color: var(--muted); font-weight: 700; }
    h1, h2, h3, p { margin-top: 0; }
    h1 { margin-bottom: 4px; font-size: 2rem; line-height: 1.15; }
    h2 { margin-top: 28px; padding-bottom: 6px; border-bottom: 1px solid var(--line); font-size: 1.25rem; }
    h3 { margin-top: 20px; font-size: 1rem; }
    .meta-grid, .card-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .card, .callout {
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--soft);
    }
    .callout { border-left: 5px solid var(--accent); }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px;
      font-size: 0.94rem;
    }
    th, td {
      padding: 10px;
      border: 1px solid var(--line);
      vertical-align: top;
      text-align: left;
    }
    th { background: var(--soft); font-weight: 800; }
    ul, ol { padding-left: 22px; }
    li + li { margin-top: 4px; }
    .small { color: var(--muted); font-size: 0.88rem; }
    .footer {
      margin-top: 34px;
      padding-top: 12px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 0.82rem;
    }
    @media print {
      body { background: white; }
      .page { width: auto; margin: 0; border: 0; border-radius: 0; }
      a { color: var(--ink); text-decoration: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="doc-header">
      <div class="mark">${safeBrand.slice(0, 1).toUpperCase() || "A"}</div>
      <div>
        <div class="brand">${safeBrand}</div>
        <h1>${safeTitle}</h1>
        <p class="small">${safeTopic}</p>
      </div>
    </header>
    ${body}
    <footer class="footer">
      Draft package generated by ADDIE Studio. Review clinical accuracy, local policy, scope of practice, and safety requirements before delivery.
    </footer>
  </main>
</body>
</html>`;
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function table(headers, rows) {
  return `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function buildDocumentPack(topic, learners, delivery, brand, evidence) {
  const safeTopic = escapeHtml(topic);
  const audience = learners || "Target clinical learners";
  const mode = delivery === "Not sure yet" ? "To be confirmed" : delivery;
  const themes = evidenceThemes(evidence);
  const base = { topic, brand };
  const commonGoals = [
    `Explain the key safety principles and evidence behind ${topic}.`,
    "Identify indications, risks, contraindications, and escalation points.",
    "Prepare the patient, equipment, environment, and documentation correctly.",
    "Demonstrate the required clinical process using a structured checklist.",
    "Reflect on performance and identify further supervised practice needs.",
  ];

  const docs = [
    {
      filename: "00-course-overview.html",
      title: "Course Overview",
      body: `
        <section class="meta-grid">
          <div class="card"><strong>Topic</strong><br>${safeTopic}</div>
          <div class="card"><strong>Learners</strong><br>${escapeHtml(audience)}</div>
          <div class="card"><strong>Delivery mode</strong><br>${escapeHtml(mode)}</div>
          <div class="card"><strong>Evidence themes</strong><br>${themes.map(escapeHtml).join(", ")}</div>
        </section>
        <h2>Purpose</h2>
        <p>This program prepares learners for safe, evidence-informed clinical practice and supervised assessment.</p>
        <h2>Package Documents</h2>
        ${list([
          "Evidence summary",
          "Lesson plan",
          "Facilitator guide",
          "Learner handout",
          "Scenario pack",
          "Assessment criteria",
          "Implementation checklist",
          "Evaluation tools",
        ])}
        <h2>Clinical Review Required</h2>
        <div class="callout">Before delivery, a clinical educator or subject matter expert should confirm evidence currency, local policy alignment, scope of practice, assessment expectations, and safety controls.</div>
      `,
    },
    {
      filename: "01-evidence-summary.html",
      title: "Evidence Summary",
      body: `
        <h2>Search Focus</h2>
        <p>${escapeHtml(searchQuery(topic))}</p>
        <h2>Detected Themes</h2>
        ${list(themes)}
        <h2>Sources To Review</h2>
        ${evidence
          .map(
            (item, index) => `
              <div class="card">
                <h3>${index + 1}. ${escapeHtml(item.title)}</h3>
                <p class="small">${escapeHtml(item.authors)}. ${escapeHtml(item.source)}, ${escapeHtml(String(item.year))}. Cited by ${escapeHtml(String(item.citedBy))}.</p>
                <p>${escapeHtml(item.abstract || "No abstract snippet available.")}</p>
                <p><a href="${escapeHtml(item.link)}">${escapeHtml(item.link)}</a></p>
              </div>
            `,
          )
          .join("")}
      `,
    },
    {
      filename: "02-lesson-plan.html",
      title: "Lesson Plan",
      body: `
        <h2>Learning Goals</h2>
        ${list(commonGoals)}
        <h2>Session Plan</h2>
        ${table(
          ["Time", "Activity", "Facilitator role", "Learner output"],
          [
            ["0-10 min", "Welcome, purpose, learner baseline", "Explain why the topic matters for patient safety", "States personal learning goal"],
            ["10-25 min", "Evidence and local policy overview", "Connect evidence themes to local expectations", "Identifies key safety points"],
            ["25-40 min", "Demonstration", "Model the process and decision points", "Notes critical steps"],
            ["40-75 min", "Guided practice", "Coach using the checklist", "Completes supervised practice"],
            ["75-95 min", "Scenario discussion", "Facilitate judgement and escalation discussion", "Explains decisions and documentation"],
            ["95-110 min", "Assessment or review", "Observe and provide feedback", "Receives next-step plan"],
            ["110-120 min", "Close", "Confirm follow-up and supervision requirements", "Completes reflection"],
          ],
        )}
        <h2>Resources Needed</h2>
        ${list(["Local policy or guideline", "Procedure or competency checklist", "Equipment or simulation resources", "Feedback forms", "Assessment record"])}
      `,
    },
    {
      filename: "03-facilitator-guide.html",
      title: "Facilitator Guide",
      body: `
        <h2>Before The Session</h2>
        ${list([
          "Review the evidence summary and local policy.",
          "Confirm whether the session includes competency sign-off.",
          "Prepare equipment, simulation resources, forms, and learner materials.",
          "Plan remediation or supervised practice pathways for learners not yet ready.",
        ])}
        <h2>Teaching Notes</h2>
        ${list([
          "Start with patient safety and why the topic matters.",
          "Keep the evidence overview brief and practical.",
          "Name decision points explicitly: proceed, pause, escalate, document.",
          "Demonstrate slowly before asking learners to practise.",
          "Use the same checklist for coaching and assessment.",
        ])}
        <h2>Debrief Prompts</h2>
        ${list([
          "What information changed your decision?",
          "What would make this situation unsafe?",
          "What did you do well?",
          "What needs more supervised practice?",
        ])}
      `,
    },
    {
      filename: "04-learner-handout.html",
      title: "Learner Handout",
      body: `
        <h2>Why This Matters</h2>
        <p>${safeTopic} requires safe decision-making, preparation, escalation, documentation, and supervised practice where required.</p>
        <h2>What You Should Be Able To Do</h2>
        ${list(commonGoals)}
        <h2>Practice Checklist</h2>
        ${list([
          "Confirm patient identity, indication, consent, and local requirements.",
          "Check risks, contraindications, and when to escalate.",
          "Prepare equipment and environment safely.",
          "Communicate clearly with the patient and team.",
          "Complete the process using the expected sequence.",
          "Document accurately and identify follow-up needs.",
        ])}
        <h2>Reflection</h2>
        ${table(["Prompt", "Your notes"], [["What do I feel ready to do?", ""], ["What do I need to practise again?", ""], ["Who can supervise or support me?", ""]])}
      `,
    },
    {
      filename: "05-scenario-pack.html",
      title: "Scenario Pack",
      body: `
        <h2>Core Scenario</h2>
        <p>A learner is asked to complete or support ${safeTopic.toLowerCase()} in a busy clinical area. The patient situation changes, and the learner must decide whether to proceed, pause, escalate, or seek help.</p>
        <h2>Scenario Questions</h2>
        ${list([
          "What information must be checked first?",
          "What finding would make this unsafe?",
          "What does the evidence or local policy suggest?",
          "Who should be contacted if there is concern?",
          "What must be documented?",
        ])}
        <h2>Variation Prompts</h2>
        ${table(
          ["Variation", "Purpose"],
          [
            ["Equipment missing or unfamiliar", "Tests preparation and escalation"],
            ["Patient anxiety or refusal", "Tests consent and communication"],
            ["Unexpected clinical finding", "Tests pause/escalate judgement"],
            ["Documentation uncertainty", "Tests policy and handover requirements"],
          ],
        )}
      `,
    },
    {
      filename: "06-assessment-criteria.html",
      title: "Assessment Criteria",
      body: `
        <h2>Competency Checklist</h2>
        ${table(
          ["Criterion", "Achieved", "Needs practice", "Notes"],
          [
            ["Confirms patient identity, indication, consent, and local requirements", "", "", ""],
            ["Checks contraindications, risks, and escalation triggers", "", "", ""],
            ["Prepares equipment and environment safely", "", "", ""],
            ["Communicates clearly with patient and team", "", "", ""],
            ["Performs required steps in correct sequence", "", "", ""],
            ["Maintains infection prevention and safety principles", "", "", ""],
            ["Recognises complications, uncertainty, or unsafe conditions", "", "", ""],
            ["Escalates appropriately", "", "", ""],
            ["Documents care accurately", "", "", ""],
            ["States follow-up or supervision requirements", "", "", ""],
          ],
        )}
        <h2>Knowledge Check</h2>
        ${list([
          `What are the main patient safety risks related to ${topic}?`,
          "What local policy or guideline must be checked before practice?",
          "What finding would make you pause or escalate?",
          "What preparation is required?",
          "What documentation is required after completion?",
        ])}
        <h2>Decision Rule</h2>
        <div class="callout">Any unsafe answer, missed escalation trigger, or inconsistent performance should lead to remediation and further supervised practice before sign-off.</div>
      `,
    },
    {
      filename: "07-implementation-checklist.html",
      title: "Implementation Checklist",
      body: `
        <h2>Readiness Checklist</h2>
        ${table(
          ["Task", "Owner", "Complete"],
          [
            ["Evidence reviewed and dated", "", ""],
            ["Local policy checked", "", ""],
            ["Clinical reviewer approved content", "", ""],
            ["Facilitator brief completed", "", ""],
            ["Equipment/resources prepared", "", ""],
            ["Learner communication sent", "", ""],
            ["Assessment process confirmed", "", ""],
            ["Feedback and evaluation forms ready", "", ""],
          ],
        )}
      `,
    },
    {
      filename: "08-evaluation-tools.html",
      title: "Evaluation Tools",
      body: `
        <h2>Learner Feedback</h2>
        ${table(
          ["Question", "Response"],
          [
            ["The training was relevant to my clinical role", "1 2 3 4 5"],
            ["I understand the key safety risks", "1 2 3 4 5"],
            ["I know when to escalate", "1 2 3 4 5"],
            ["I know what further supervised practice I need", "1 2 3 4 5"],
            ["The session was clear and practical", "1 2 3 4 5"],
          ],
        )}
        <h2>Improvement Log</h2>
        ${table(["Finding", "Evidence", "Change required", "Owner", "Due date"], [["", "", "", "", ""], ["", "", "", "", ""]])}
      `,
    },
  ];

  return docs.map((doc) => ({
    filename: doc.filename,
    content: documentShell({ ...base, title: doc.title, body: doc.body }),
  }));
}

function makeReadme(topic, brand) {
  return `ADDIE Studio Training Package

Brand: ${brand}
Topic: ${topic}

This folder contains separate printable HTML documents:

- Course overview
- Evidence summary
- Lesson plan
- Facilitator guide
- Learner handout
- Scenario pack
- Assessment criteria
- Implementation checklist
- Evaluation tools

Open each HTML document in a browser. Use Print > Save as PDF if you want individual PDF files.

Review required:
Before delivery, a clinician, educator, or subject matter expert should check evidence currency, local policy alignment, clinical accuracy, scope of practice, and safety requirements.
`;
}

function makeCrcTable() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(bytes) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(value) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function writeUint32(value) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const localHeader = new Uint8Array([
      ...writeUint32(0x04034b50),
      ...writeUint16(20),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint32(crc),
      ...writeUint32(data.length),
      ...writeUint32(data.length),
      ...writeUint16(nameBytes.length),
      ...writeUint16(0),
    ]);
    localParts.push(localHeader, nameBytes, data);

    const centralHeader = new Uint8Array([
      ...writeUint32(0x02014b50),
      ...writeUint16(20),
      ...writeUint16(20),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint32(crc),
      ...writeUint32(data.length),
      ...writeUint32(data.length),
      ...writeUint16(nameBytes.length),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint16(0),
      ...writeUint32(0),
      ...writeUint32(offset),
    ]);
    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + data.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endRecord = new Uint8Array([
    ...writeUint32(0x06054b50),
    ...writeUint16(0),
    ...writeUint16(0),
    ...writeUint16(files.length),
    ...writeUint16(files.length),
    ...writeUint32(centralSize),
    ...writeUint32(offset),
    ...writeUint16(0),
  ]);

  return new Blob([...localParts, ...centralParts, endRecord], { type: "application/zip" });
}

function exportCourse() {
  const topic = cleanText(els.topicInput.value) || "addie-course";
  const learners = cleanText(els.learnerInput.value);
  const delivery = els.deliveryInput.value;
  const brand = cleanText(els.brandInput.value) || "ADDIE Studio";
  const evidence = lastEvidence.length ? lastEvidence : fallbackEvidence(topic);
  const docs = buildDocumentPack(topic, learners, delivery, brand, evidence);
  const files = [
    { name: "README.txt", content: makeReadme(topic, brand) },
    ...docs.map((doc) => ({ name: doc.filename, content: doc.content })),
  ];
  const filename = `${slug(topic)}-training-document-pack.zip`;
  const blob = createZip(files);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.tab));
});

els.startButton.addEventListener("click", runStudio);
els.copyButton.addEventListener("click", copyActive);
els.exportButton.addEventListener("click", exportCourse);
setProgress(0, "Ready");
