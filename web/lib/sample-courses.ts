import type { CourseLevel } from "@/lib/mock-data";

export interface SampleCourseSource {
  label: string;
  url: string;
}

export interface SampleCourseModule {
  id: string;
  title: string;
  summary: string;
  lessons: string[];
  project: string;
}

export interface SampleCourse {
  id: string;
  title: string;
  subject: string;
  level: CourseLevel;
  audience: string;
  duration: string;
  description: string;
  whyItWorks: string;
  capstone: string;
  modules: SampleCourseModule[];
  sources: SampleCourseSource[];
}

export const sampleCourses: SampleCourse[] = [
  {
    id: "everyday-microeconomics",
    title: "Everyday Microeconomics: Choices, Markets, and Trade-Offs",
    subject: "Economics",
    level: "Intermediate",
    audience: "Advanced high school, first-year college, and curious adult learners",
    duration: "9 modules / 27 lessons",
    description:
      "A graph-first, policy-aware microeconomics course that teaches learners to reason from scarcity, incentives, markets, and welfare instead of memorizing definitions.",
    whyItWorks:
      "Economics shows off Tuto's strengths in diagrams, step-by-step problem solving, misconception repair, and short policy arguments with evidence.",
    capstone:
      "Analyze a real local market such as rent, groceries, rideshare, or tutoring. Build supply-demand graphs, estimate elasticity, explain welfare effects, and write a one-page policy memo.",
    sources: [
      {
        label: "MIT OCW Principles of Microeconomics",
        url: "https://ocw.mit.edu/courses/14-01-principles-of-microeconomics-fall-2023/",
      },
      {
        label: "MIT OCW Supply and Demand unit",
        url: "https://ocw.mit.edu/courses/14-01sc-principles-of-microeconomics-fall-2011/pages/unit-1-supply-and-demand/",
      },
      {
        label: "OpenStax Principles of Microeconomics 2e",
        url: "https://openstax.org/books/principles-microeconomics-2e/pages/index",
      },
      {
        label: "Khan Academy Microeconomics",
        url: "https://www.khanacademy.org/economics-finance-domain/microeconomics/basic-economic-concepts-gen-micro",
      },
    ],
    modules: [
      {
        id: "choice-and-scarcity",
        title: "Choice Under Scarcity",
        summary:
          "Start with the core economic move: every choice has an opportunity cost because time, attention, money, and capacity are limited.",
        lessons: [
          "Turn a daily schedule into a trade-off map.",
          "Use production possibilities to separate feasible, efficient, and impossible choices.",
          "Distinguish positive claims from normative recommendations.",
        ],
        project: "Write a short decision memo comparing two study, work, or spending choices.",
      },
      {
        id: "gains-from-trade",
        title: "Specialization and Gains From Trade",
        summary:
          "Use comparative advantage to explain why voluntary exchange can make both sides better off even when one side is absolutely better at everything.",
        lessons: [
          "Calculate opportunity cost from a two-good production table.",
          "Find mutually beneficial trade ranges.",
          "Explain why specialization can raise total output while creating dependence.",
        ],
        project: "Model a two-person trade and identify the price range that benefits both sides.",
      },
      {
        id: "supply-demand",
        title: "Supply, Demand, and Equilibrium",
        summary:
          "Build the most important graph in introductory economics, then use shifts to predict price, quantity, shortage, and surplus.",
        lessons: [
          "Construct demand and supply curves from buyer and seller behavior.",
          "Predict equilibrium after a demand or supply shock.",
          "Diagnose shortages and surpluses without guessing.",
        ],
        project: "Explain a recent price change with a clean graph and a plain-English causal story.",
      },
      {
        id: "elasticity",
        title: "Elasticity and Responsiveness",
        summary:
          "Move beyond direction of change and ask how strongly buyers or sellers respond when price, income, or substitutes change.",
        lessons: [
          "Calculate price elasticity with midpoint reasoning.",
          "Connect elasticity to revenue and burden sharing.",
          "Compare short-run and long-run responsiveness.",
        ],
        project: "Estimate which of two goods would react more to a price increase and defend the estimate.",
      },
      {
        id: "surplus-and-welfare",
        title: "Surplus, Welfare, and Deadweight Loss",
        summary:
          "Translate graphs into welfare language: consumer surplus, producer surplus, total surplus, and losses from blocked trades.",
        lessons: [
          "Read consumer and producer surplus from a graph.",
          "Explain deadweight loss as mutually beneficial trades that do not happen.",
          "Compare efficiency with fairness.",
        ],
        project: "Evaluate a price ceiling or price floor with a graph and a fairness paragraph.",
      },
      {
        id: "consumer-choice",
        title: "Consumer Choice and Budget Constraints",
        summary:
          "Connect preferences, prices, income, and substitution to the choices people make under constraints when every option has a cost.",
        lessons: [
          "Read a budget line and explain what changes its slope.",
          "Describe marginal utility without turning it into vague preference talk.",
          "Use substitution and income effects to explain behavior.",
        ],
        project: "Create a small household choice problem and explain the likely trade-off.",
      },
      {
        id: "firms-and-costs",
        title: "Firms, Costs, and Production",
        summary:
          "Understand how firms turn inputs into output, how costs change with scale, and why marginal cost drives decisions.",
        lessons: [
          "Separate fixed, variable, average, and marginal cost.",
          "Connect production functions to diminishing returns.",
          "Find profit-maximizing quantity from marginal revenue and marginal cost.",
        ],
        project: "Build a small cost table for a tutoring, food, or digital service business.",
      },
      {
        id: "market-power",
        title: "Competition, Monopoly, and Oligopoly",
        summary:
          "Compare price-taking firms with firms that have market power, then study strategic behavior when rivals react.",
        lessons: [
          "Explain why competitive firms take price as given.",
          "Show how monopoly restricts quantity and changes surplus.",
          "Use a payoff matrix to reason about oligopoly choices.",
        ],
        project: "Compare two industries and argue which is closer to competition, monopoly, or oligopoly.",
      },
      {
        id: "externalities-and-policy",
        title: "Externalities, Public Goods, and Policy Design",
        summary:
          "Use market failure as a tool for policy analysis, not as a slogan for or against government action.",
        lessons: [
          "Identify external costs and benefits in concrete cases.",
          "Explain why public goods create free-rider problems.",
          "Compare taxes, subsidies, regulation, and property-rights approaches.",
        ],
        project: "Write the final market memo with graphs, welfare effects, and a policy recommendation.",
      },
    ],
  },
  {
    id: "climate-systems-lab",
    title: "Climate Systems Lab: Evidence, Energy, and Action",
    subject: "Science",
    level: "Intermediate",
    audience: "AP environmental science, intro college, civic learners, and teams learning climate basics",
    duration: "9 modules / 27 lessons",
    description:
      "A science-first climate course that follows energy, evidence, uncertainty, risk, and action from basic radiation physics to local adaptation plans.",
    whyItWorks:
      "Climate learning benefits from Tuto's ability to connect diagrams, data interpretation, model uncertainty, and project-based explanation.",
    capstone:
      "Create a local climate-risk explainer for a school, city, or business. Include evidence, a simple scenario, likely impacts, uncertainty, and an adaptation or mitigation proposal.",
    sources: [
      {
        label: "MIT Climate Science, Risk and Solutions primer",
        url: "https://ocw.mit.edu/courses/res-env-005-climate-science-risk-solutions-a-climate-primer/",
      },
      {
        label: "NASA Climate Change Evidence",
        url: "https://science.nasa.gov/climate-change/evidence/",
      },
      {
        label: "NASA Climate Change Effects",
        url: "https://science.nasa.gov/climate-change/effects/",
      },
      {
        label: "OpenStax Biology 2e Ecology of Ecosystems",
        url: "https://openstax.org/books/biology-2e/pages/46-1-ecology-of-ecosystems",
      },
    ],
    modules: [
      {
        id: "energy-balance",
        title: "Earth's Energy Balance",
        summary:
          "Begin with incoming sunlight, outgoing infrared radiation, albedo, and the idea of balance before discussing climate change.",
        lessons: [
          "Draw the planet as an energy system.",
          "Explain albedo with ice, clouds, land, and ocean examples.",
          "Predict warming or cooling from changes in incoming and outgoing energy.",
        ],
        project: "Annotate an energy-balance diagram with the main flows and uncertainties.",
      },
      {
        id: "greenhouse-physics",
        title: "Greenhouse Gases and Radiation",
        summary:
          "Learn how greenhouse gases absorb and emit infrared radiation and why concentration, lifetime, and feedback matter.",
        lessons: [
          "Compare visible light with infrared radiation.",
          "Explain why carbon dioxide, methane, and water vapor affect heat flow.",
          "Separate the greenhouse effect from common blanket and glasshouse analogies.",
        ],
        project: "Create a concept map connecting molecules, radiation, and temperature.",
      },
      {
        id: "climate-evidence",
        title: "Evidence for Modern Warming",
        summary:
          "Use multiple lines of evidence, including temperature records, ice, oceans, and biological shifts, to avoid single-chart thinking.",
        lessons: [
          "Read a global temperature anomaly graph.",
          "Connect ocean heat, glaciers, and sea level to energy accumulation.",
          "Evaluate why independent evidence streams strengthen a claim.",
        ],
        project: "Build a three-evidence slide that explains modern warming to a skeptical audience.",
      },
      {
        id: "paleoclimate",
        title: "Paleoclimate and Proxies",
        summary:
          "Study how ice cores, sediments, tree rings, and other proxies let scientists reason about climates before thermometers.",
        lessons: [
          "Explain what a climate proxy measures directly and indirectly.",
          "Compare resolution and uncertainty across proxy records.",
          "Use past climate change to frame, not dismiss, modern change.",
        ],
        project: "Write a proxy evidence note that names the measurement, inference, and limit.",
      },
      {
        id: "oceans-ice-sea-level",
        title: "Oceans, Ice, and Sea Level",
        summary:
          "Follow heat into the ocean, ice sheets, glaciers, and coastlines to understand impacts that unfold over different time scales.",
        lessons: [
          "Explain thermal expansion and land-ice melt.",
          "Compare sea ice, glaciers, and ice sheets.",
          "Connect sea-level risk to local geography and infrastructure.",
        ],
        project: "Draft a coastal risk brief for a fictional town with three adaptation choices.",
      },
      {
        id: "feedbacks",
        title: "Feedback Loops and Tipping Risks",
        summary:
          "Learn how feedbacks can amplify or dampen warming, and how risk language differs from certainty language.",
        lessons: [
          "Identify positive and negative feedbacks.",
          "Analyze ice-albedo and water-vapor feedbacks.",
          "Explain tipping risk without exaggerating or minimizing it.",
        ],
        project: "Make a feedback loop diagram with one evidence note and one uncertainty note.",
      },
      {
        id: "models",
        title: "Climate Models and Scenarios",
        summary:
          "Treat models as structured experiments: useful because their assumptions are visible and testable.",
        lessons: [
          "Explain the difference between weather forecasts and climate projections.",
          "Read a scenario range without treating it as one prediction.",
          "Identify what models can test and what they cannot settle alone.",
        ],
        project: "Compare two emissions scenarios and summarize the decision-relevant difference.",
      },
      {
        id: "ecosystems-and-health",
        title: "Ecosystems, Food, and Health",
        summary:
          "Connect warming, water, species ranges, agriculture, and human health through systems thinking.",
        lessons: [
          "Trace one impact pathway from climate driver to human consequence.",
          "Explain biodiversity stress using habitat, timing, and migration limits.",
          "Compare acute hazards with chronic pressures.",
        ],
        project: "Create an impact chain for heat, wildfire smoke, flooding, or crop stress.",
      },
      {
        id: "action-and-communication",
        title: "Mitigation, Adaptation, and Public Communication",
        summary:
          "Finish by comparing emissions cuts, adaptation, resilience, values, trade-offs, and how to talk about uncertainty responsibly.",
        lessons: [
          "Distinguish mitigation from adaptation with examples.",
          "Compare individual, institutional, and policy actions.",
          "Write a climate explanation that is accurate, calm, and useful.",
        ],
        project: "Complete the local climate-risk explainer and present a prioritized action plan.",
      },
    ],
  },
  {
    id: "philosophy-of-knowing",
    title: "How Do We Know? Knowledge, Mind, and Responsibility",
    subject: "Philosophy",
    level: "Intermediate",
    audience: "Honors high school, intro philosophy, adult enrichment, and AI-curious learners",
    duration: "9 modules / 27 lessons",
    description:
      "A Socratic philosophy course that teaches learners to build, test, revise, and defend arguments about knowledge, mind, freedom, ethics, and AI.",
    whyItWorks:
      "Philosophy showcases Tuto as a question-asking tutor that can map arguments, surface assumptions, test counterexamples, and coach revisions.",
    capstone:
      "Create an argument map answering whether an AI system can know, decide, or be responsible. Include definitions, objections, replies, and one revised conclusion.",
    sources: [
      {
        label: "Stanford Encyclopedia of Philosophy: Epistemology",
        url: "https://plato.stanford.edu/entries/epistemology/",
      },
      {
        label: "Stanford Encyclopedia of Philosophy: Free Will",
        url: "https://plato.stanford.edu/entries/freewill/",
      },
      {
        label: "Stanford Encyclopedia of Philosophy: Ethics of AI and Robotics",
        url: "https://plato.stanford.edu/entries/ethics-ai/",
      },
      {
        label: "OpenStax Introduction to Philosophy",
        url: "https://openstax.org/books/introduction-philosophy/pages/index",
      },
    ],
    modules: [
      {
        id: "arguments",
        title: "What Makes an Argument Good?",
        summary:
          "Begin with claims, reasons, assumptions, validity, soundness, and charity so later debates have a shared toolkit.",
        lessons: [
          "Separate a claim from evidence and explanation.",
          "Map premises, conclusion, and hidden assumptions.",
          "Test an argument for validity, soundness, and relevance.",
        ],
        project: "Create an argument map for a short editorial or everyday claim.",
      },
      {
        id: "skepticism",
        title: "Skepticism and Certainty",
        summary:
          "Use skeptical challenges to ask what counts as knowledge and how much certainty a responsible belief requires.",
        lessons: [
          "Explain the difference between doubt and radical skepticism.",
          "Compare everyday knowledge with philosophical certainty.",
          "Build a reply to a skeptical scenario without hand-waving.",
        ],
        project: "Write a dialogue between a skeptic and a responder about one belief.",
      },
      {
        id: "perception-memory-testimony",
        title: "Perception, Memory, and Testimony",
        summary:
          "Study the ordinary sources of knowledge that make learning possible and fragile: perception, memory, testimony, expertise, and trust.",
        lessons: [
          "Analyze when perception is reliable and when it misleads.",
          "Explain why memory is reconstructive rather than a perfect recording.",
          "Evaluate testimony, expertise, and trust.",
        ],
        project: "Create a trust checklist for learning from a person, text, or model.",
      },
      {
        id: "justification",
        title: "Justification and Epistemic Luck",
        summary:
          "Move from true belief to justified belief, then test the classic problem of lucky correctness.",
        lessons: [
          "Distinguish truth, belief, and justification.",
          "Use Gettier-style cases to pressure simple definitions of knowledge.",
          "Compare internal and external standards for justification.",
        ],
        project: "Invent a case where someone is right for the wrong reason and analyze it.",
      },
      {
        id: "mind-consciousness",
        title: "Mind and Consciousness",
        summary:
          "Ask what minds are, how consciousness relates to bodies, and why subjective experience is hard to explain.",
        lessons: [
          "Compare dualist, physicalist, and functionalist starting points.",
          "Explain the hard problem of consciousness in plain language.",
          "Test whether behavior is enough to infer mentality.",
        ],
        project: "Write a short position note on whether a chatbot could have experiences.",
      },
      {
        id: "personal-identity",
        title: "Personal Identity Over Time",
        summary:
          "Explore what makes someone the same person across memory change, bodily change, and psychological continuity.",
        lessons: [
          "Compare body, memory, and psychological-continuity views.",
          "Use thought experiments without letting them replace argument.",
          "Connect identity claims to responsibility and care.",
        ],
        project: "Analyze a memory-transfer or teleportation case with objections.",
      },
      {
        id: "free-will",
        title: "Free Will and Determinism",
        summary:
          "Study whether freedom requires alternative possibilities, control, reasons responsiveness, or something else.",
        lessons: [
          "Define determinism without confusing it with fatalism.",
          "Compare compatibilist and incompatibilist views.",
          "Apply responsibility tests to a constrained decision.",
        ],
        project: "Make a responsibility scale for three cases with different constraints.",
      },
      {
        id: "ethics",
        title: "Ethics, Values, and Responsibility",
        summary:
          "Introduce moral reasoning through consequences, duties, virtues, care, and disagreement about what matters.",
        lessons: [
          "Compare consequentialist, deontological, and virtue-ethics questions.",
          "Find the moral disagreement beneath a policy dispute.",
          "Explain why a conclusion can be valid but morally incomplete.",
        ],
        project: "Write a two-framework analysis of a hard choice and explain where the frameworks agree, conflict, and need judgment.",
      },
      {
        id: "ai-agency",
        title: "AI, Agency, and Responsibility",
        summary:
          "Bring the course together by asking what current AI systems can know, decide, explain, and be accountable for.",
        lessons: [
          "Separate intelligence, understanding, agency, and responsibility.",
          "Map the human and institutional actors around an AI decision.",
          "Build objections and replies for the final argument map.",
        ],
        project: "Complete the argument map on AI knowledge, decision-making, or responsibility.",
      },
    ],
  },
  {
    id: "reading-literature-closely",
    title: "Reading Literature Closely: Poetry, Form, and Interpretation",
    subject: "English",
    level: "Intermediate",
    audience: "High school literature, first-year humanities, lifelong readers, and writing tutors",
    duration: "10 modules / 30 lessons",
    description:
      "A close-reading course that turns vague reactions into evidence-based interpretation through diction, image, sound, form, context, and revision.",
    whyItWorks:
      "Literature lets Tuto coach annotation, vocabulary, interpretive claims, evidence selection, thesis development, and revision in a tight feedback loop.",
    capstone:
      "Produce an annotated poem portfolio plus a short comparative essay or presentation explaining how form creates meaning across two texts.",
    sources: [
      {
        label: "MIT OCW Reading Poetry",
        url: "https://ocw.mit.edu/courses/21l-004-reading-poetry-spring-2018/",
      },
      {
        label: "Poetry Foundation Education",
        url: "https://www.poetryfoundation.org/education",
      },
      {
        label: "Poetry Foundation: Learning the Poetic Line",
        url: "https://www.poetryfoundation.org/articles/70144/learning-the-poetic-line",
      },
      {
        label: "Purdue OWL Writing in Literature",
        url: "https://owl.purdue.edu/owl/subject_specific_writing/writing_in_literature/index.html",
      },
      {
        label: "Open Yale Courses Introduction to Theory of Literature",
        url: "https://oyc.yale.edu/english/engl-300",
      },
    ],
    modules: [
      {
        id: "close-reading",
        title: "How Close Reading Works",
        summary:
          "Learn close reading as a disciplined habit of noticing, questioning, interpreting, and testing claims against textual evidence.",
        lessons: [
          "Annotate diction, repetition, contrast, and surprise.",
          "Turn observations into interpretive questions.",
          "Separate summary from analysis.",
        ],
        project: "Create a two-column annotation log with observation and possible meaning.",
      },
      {
        id: "speaker-and-voice",
        title: "Speaker, Voice, and Address",
        summary:
          "Study who is speaking, to whom, under what pressure, and how tone changes what a line does.",
        lessons: [
          "Distinguish poet, narrator, speaker, and persona.",
          "Track shifts in address and tone.",
          "Use pronouns and implied audience as evidence.",
        ],
        project: "Write a speaker profile grounded in five textual details and explain how voice changes the reader's trust.",
      },
      {
        id: "image-and-metaphor",
        title: "Image, Metaphor, and Sensory Detail",
        summary:
          "Analyze how imagery and figurative language make abstract ideas felt, resisted, or complicated.",
        lessons: [
          "Classify sensory images and their emotional pressure.",
          "Explain what a metaphor transfers and what it hides.",
          "Track a recurring image across a poem or passage.",
        ],
        project: "Build an image map and write a paragraph about the pattern it reveals.",
      },
      {
        id: "sound-and-meter",
        title: "Sound, Rhythm, and Meter",
        summary:
          "Listen for stress, repetition, pause, rhyme, alliteration, and sonic tension without reducing poems to counting.",
        lessons: [
          "Scan a short passage for stress and variation.",
          "Explain how sound supports or resists meaning.",
          "Compare strict pattern with expressive disruption.",
        ],
        project: "Record or mark a passage and explain one important sound choice.",
      },
      {
        id: "syntax-and-line",
        title: "Syntax, Line Breaks, and Enjambment",
        summary:
          "Study how sentence movement and lineation control suspense, speed, emphasis, and ambiguity.",
        lessons: [
          "Compare end-stopped and enjambed lines.",
          "Track sentence grammar across line breaks.",
          "Rewrite a lineated passage as prose to see what changes.",
        ],
        project: "Create a line-break experiment and explain the interpretive effect.",
      },
      {
        id: "forms",
        title: "Forms: Sonnets, Odes, Elegies, and Free Verse",
        summary:
          "Learn forms as inherited pressures that writers can fulfill, bend, parody, or break while still making local choices line by line.",
        lessons: [
          "Identify basic formal expectations without forcing a poem into a template.",
          "Explain the turn in a sonnet or argument-like poem.",
          "Compare free verse with formal constraint.",
        ],
        project: "Annotate how one poem uses or resists a formal expectation and explain the effect on meaning.",
      },
      {
        id: "ambiguity",
        title: "Ambiguity and Difficult Poems",
        summary:
          "Treat difficulty as a set of choices to investigate rather than a failure to understand immediately.",
        lessons: [
          "Name the exact source of confusion.",
          "Generate multiple plausible readings and test each one.",
          "Use ambiguity as evidence when the text sustains it.",
        ],
        project: "Write two competing readings of the same difficult passage, then test both against textual evidence.",
      },
      {
        id: "context",
        title: "Context Without Flattening the Text",
        summary:
          "Use history, biography, genre, publication, and social context to deepen reading without replacing textual analysis.",
        lessons: [
          "Decide when context answers a textual question.",
          "Avoid biography as shortcut explanation.",
          "Connect context to specific words, images, or forms.",
        ],
        project: "Add one context note to an annotation and revise the interpretation.",
      },
      {
        id: "critical-lenses",
        title: "Critical Lenses and Literary Theory",
        summary:
          "Try formalist, historical, feminist, postcolonial, psychoanalytic, and reader-response questions as tools, not costumes.",
        lessons: [
          "Use a lens to ask a sharper question.",
          "Compare what two lenses make visible or obscure.",
          "Avoid turning a reading into a label parade.",
        ],
        project: "Apply two lenses to one passage and name what each reveals, distorts, or leaves unanswered.",
      },
      {
        id: "essay-revision",
        title: "Thesis, Evidence, and Revision",
        summary:
          "Move from annotations to a literary essay with a specific claim, well-chosen evidence, and revision that strengthens reasoning.",
        lessons: [
          "Turn a pattern into a debatable thesis.",
          "Embed quotation evidence with analysis.",
          "Revise for claim, evidence, and consequence.",
        ],
        project: "Complete the annotated portfolio and comparative interpretation.",
      },
    ],
  },
  {
    id: "argument-builder",
    title: "Argument Builder: Rhetoric, Research, and Public Writing",
    subject: "English",
    level: "Beginner",
    audience: "AP Lang, first-year composition, professionals, and learners improving persuasive writing",
    duration: "10 modules / 30 lessons",
    description:
      "A writing-process course that takes learners from rhetorical situation to research, thesis, evidence, counterargument, style, and public-facing revision.",
    whyItWorks:
      "Writing courses let Tuto coach a full process: idea generation, source vetting, outlining, draft feedback, revision, and reflection.",
    capstone:
      "Write a research-backed op-ed, policy brief, or public explainer with an annotated bibliography and a revision reflection.",
    sources: [
      {
        label: "Purdue OWL Rhetorical Strategies",
        url: "https://owl.purdue.edu/owl/general_writing/academic_writing/establishing_arguments/rhetorical_strategies.html",
      },
      {
        label: "Purdue OWL Argument Papers",
        url: "https://owl.purdue.edu/owl/general_writing/common_writing_assignments/argument_papers/index.html",
      },
      {
        label: "Purdue OWL Establishing Arguments",
        url: "https://owl.purdue.edu/owl/general_writing/academic_writing/establishing_arguments/index.html",
      },
      {
        label: "OpenStax Writing Guide: Annotated Bibliography",
        url: "https://openstax.org/books/writing-guide/pages/14-1-compiling-sources-for-an-annotated-bibliography",
      },
    ],
    modules: [
      {
        id: "rhetorical-situation",
        title: "Rhetorical Situation",
        summary:
          "Define writer, audience, purpose, constraints, context, genre, and stakes before drafting.",
        lessons: [
          "Identify audience needs and likely resistance.",
          "Separate purpose from topic.",
          "Choose a genre that matches the situation.",
        ],
        project: "Create a rhetorical situation brief for a real writing task.",
      },
      {
        id: "appeals",
        title: "Ethos, Logos, and Pathos",
        summary:
          "Use rhetorical appeals as analytical tools for trust, reasoning, and emotion rather than as decoration.",
        lessons: [
          "Find credibility cues and credibility problems.",
          "Distinguish evidence from reasoning.",
          "Use emotion ethically by connecting it to stakes.",
        ],
        project: "Annotate an op-ed for appeals and write a paragraph on its strongest move.",
      },
      {
        id: "claims",
        title: "Claims and Debatable Theses",
        summary:
          "Transform broad topics into claims that are arguable, specific, consequential, and answerable with evidence.",
        lessons: [
          "Test whether a thesis can be disagreed with reasonably.",
          "Narrow a topic by audience, problem, and consequence.",
          "Revise claims from vague to contestable.",
        ],
        project: "Draft three thesis versions and explain which one is strongest.",
      },
      {
        id: "evidence-and-warrants",
        title: "Evidence, Warrants, and Reasoning",
        summary:
          "Teach the hidden bridge between evidence and claim so arguments do not become quote piles.",
        lessons: [
          "Classify facts, examples, expert testimony, data, and anecdotes.",
          "Name the warrant that connects evidence to the claim.",
          "Explain limitations in evidence without surrendering the argument.",
        ],
        project: "Build an evidence table with claim, evidence, warrant, and limit.",
      },
      {
        id: "source-quality",
        title: "Finding and Evaluating Credible Sources",
        summary:
          "Evaluate authority, recency, method, bias, relevance, and publication context before deciding what a source can responsibly prove.",
        lessons: [
          "Use lateral reading to inspect a source.",
          "Compare scholarly, journalistic, governmental, and advocacy sources.",
          "Decide when a source is credible for this claim and audience.",
        ],
        project: "Create a source-quality scorecard for five sources and decide which two deserve a central role.",
      },
      {
        id: "annotated-bibliography",
        title: "Annotated Bibliography",
        summary:
          "Summarize, evaluate, and position sources so research becomes usable for drafting rather than a stack of disconnected quotations.",
        lessons: [
          "Write a concise source summary.",
          "Evaluate credibility and relevance.",
          "Explain how the source will function in the argument.",
        ],
        project: "Complete four annotated bibliography entries for the capstone.",
      },
      {
        id: "counterargument",
        title: "Counterargument and Rebuttal",
        summary:
          "Strengthen arguments by representing opposing views fairly, conceding real limits, and replying with precise evidence.",
        lessons: [
          "Identify the strongest reasonable objection.",
          "Avoid strawman and concession without response.",
          "Use rebuttal, qualification, or reframing.",
        ],
        project: "Write a counterargument paragraph with one fair concession and one reply.",
      },
      {
        id: "structure",
        title: "Structure and Transitions",
        summary:
          "Organize claims into a sequence that makes the reader's path feel necessary from problem to evidence to conclusion.",
        lessons: [
          "Choose problem-solution, cause-effect, comparison, or question-driven structure.",
          "Write topic sentences that advance the argument.",
          "Use transitions to show logic, not just sequence.",
        ],
        project: "Convert the research plan into a paragraph-by-paragraph outline.",
      },
      {
        id: "style",
        title: "Style, Clarity, and Sentence Revision",
        summary:
          "Revise sentences for emphasis, rhythm, concision, and audience-appropriate voice so style supports the argument.",
        lessons: [
          "Find the main actor and action in a sentence.",
          "Cut throat-clearing and vague modifiers.",
          "Vary sentence rhythm without losing clarity.",
        ],
        project: "Revise one paragraph three ways: concise, vivid, and formal.",
      },
      {
        id: "public-writing",
        title: "Public-Facing Argument",
        summary:
          "Adapt a research argument into a form people might actually read, share, discuss, and challenge.",
        lessons: [
          "Write a lead that frames stakes quickly.",
          "Choose a title, deck, or callout that serves the argument.",
          "Reflect on revision choices and audience fit.",
        ],
        project: "Complete the op-ed, policy brief, or explainer with bibliography and reflection.",
      },
    ],
  },
  {
    id: "data-sensemaking-ai",
    title: "Data Sensemaking for Humans and AI",
    subject: "Data",
    level: "Intermediate",
    audience: "Advanced high school, intro college, product teams, operators, and AI-curious analysts",
    duration: "10 modules / 30 lessons",
    description:
      "A statistics and data-literacy course that teaches learners to ask measurable questions, reason with uncertainty, avoid false certainty, and communicate ethical limits.",
    whyItWorks:
      "Data learning benefits from adaptive practice, visual reasoning, simulated experiments, and clear explanations of why significant does not always mean important.",
    capstone:
      "Investigate an open dataset, build visualizations, make one evidence-backed claim with uncertainty, and write an ethical risk note about misuse or bias.",
    sources: [
      {
        label: "MIT OCW Introduction to Probability and Statistics",
        url: "https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/",
      },
      {
        label: "OpenStax Introductory Statistics",
        url: "https://openstax.org/books/introductory-statistics/pages/index",
      },
      {
        label: "Khan Academy AP Statistics",
        url: "https://www.khanacademy.org/math/ap-statistics",
      },
      {
        label: "Stanford Encyclopedia of Philosophy: Ethics of AI and Robotics",
        url: "https://plato.stanford.edu/entries/ethics-ai/",
      },
    ],
    modules: [
      {
        id: "measurable-questions",
        title: "Asking Measurable Questions",
        summary:
          "Turn fuzzy curiosity into variables, populations, comparisons, and decisions that data can actually address.",
        lessons: [
          "Distinguish descriptive, comparative, predictive, and causal questions.",
          "Define population, sample, unit, and variable.",
          "Name what decision the analysis should inform.",
        ],
        project: "Rewrite three vague questions as measurable analysis prompts.",
      },
      {
        id: "sampling-bias",
        title: "Sampling and Bias",
        summary:
          "Understand how data collection shapes what can be claimed, what remains invisible, and which errors survive scale.",
        lessons: [
          "Compare random, convenience, stratified, and cluster samples.",
          "Identify selection, nonresponse, survivorship, and measurement bias.",
          "Explain why bigger data can still be biased data.",
        ],
        project: "Audit a dataset or survey for who is missing and why it matters.",
      },
      {
        id: "visualizing-distributions",
        title: "Visualizing Distributions",
        summary:
          "Use plots to see center, spread, shape, outliers, and group differences before calculating too much.",
        lessons: [
          "Read histograms, dot plots, box plots, and density shapes.",
          "Compare mean and median under skew.",
          "Spot outliers without treating every outlier as an error.",
        ],
        project: "Create a one-page visual profile of one variable with center, spread, shape, and outlier notes.",
      },
      {
        id: "probability-intuition",
        title: "Probability Intuition",
        summary:
          "Build probability from outcomes, long-run frequency, conditional information, and common base-rate traps.",
        lessons: [
          "Use sample spaces and complements.",
          "Interpret conditional probability in plain language.",
          "Avoid base-rate neglect and conjunction mistakes.",
        ],
        project: "Explain a medical, search, or moderation false-positive case with a small table.",
      },
      {
        id: "random-variables",
        title: "Random Variables and Distributions",
        summary:
          "Connect uncertainty to models such as binomial, normal, and sampling distributions, then explain what each model assumes.",
        lessons: [
          "Define expected value and variability.",
          "Use binomial reasoning for repeated yes/no events.",
          "Explain why sampling distributions make inference possible.",
        ],
        project: "Simulate repeated samples and describe what stabilizes, what varies, and why the model helps.",
      },
      {
        id: "confidence-intervals",
        title: "Confidence Intervals",
        summary:
          "Treat intervals as uncertainty statements about estimation, not magic ranges that guarantee truth.",
        lessons: [
          "Build intuition for margin of error.",
          "Interpret a confidence interval correctly.",
          "Explain how sample size affects precision.",
        ],
        project: "Estimate a proportion or mean and write a careful uncertainty sentence.",
      },
      {
        id: "hypothesis-tests",
        title: "Hypothesis Tests and P-Values",
        summary:
          "Learn the logic of null hypotheses, p-values, errors, power, and practical significance without overstating what a test proves.",
        lessons: [
          "State null and alternative hypotheses.",
          "Interpret a p-value without saying the null is probably true.",
          "Compare statistical significance with real-world importance.",
        ],
        project: "Write two interpretations of a result: one responsible and one misleading.",
      },
      {
        id: "correlation-regression",
        title: "Correlation, Regression, and Causal Caution",
        summary:
          "Use relationships between variables carefully while naming confounding, extrapolation, and causal limits.",
        lessons: [
          "Read scatterplots and correlation direction.",
          "Interpret slope, intercept, and residuals.",
          "Explain why correlation alone does not prove causation.",
        ],
        project: "Build a small regression explanation with one confounder warning.",
      },
      {
        id: "bayesian-updating",
        title: "Bayesian Updating and Forecasting",
        summary:
          "Use prior beliefs, new evidence, and likelihood to improve estimates without pretending certainty.",
        lessons: [
          "Explain prior, evidence, and posterior in ordinary language.",
          "Update a belief with a simple probability table.",
          "Compare forecasting as calibration with forecasting as confidence theater.",
        ],
        project: "Update a simple forecast after new evidence and explain what changed.",
      },
      {
        id: "ai-ethics-uncertainty",
        title: "AI, Uncertainty, and Ethical Decisions",
        summary:
          "Bring statistical reasoning into AI-era decisions about prediction, automation, accountability, bias, and harm.",
        lessons: [
          "Identify stakeholders and error costs in an automated decision.",
          "Compare accuracy, calibration, fairness, and interpretability.",
          "Write a risk note that names uncertainty and misuse paths.",
        ],
        project: "Complete the dataset investigation with a claim, uncertainty note, and ethical risk note.",
      },
    ],
  },
];

export function getSampleCourseById(id: string) {
  return sampleCourses.find((course) => course.id === id) ?? null;
}

export function getSampleCourseStats(course: SampleCourse) {
  return {
    moduleCount: course.modules.length,
    lessonCount: course.modules.reduce((total, module) => total + module.lessons.length, 0),
    sourceCount: course.sources.length,
  };
}

export function buildSampleCoursePrompt(course: SampleCourse) {
  const moduleLines = course.modules
    .map((module, index) => {
      const lessons = module.lessons.map((lesson) => `      - ${lesson}`).join("\n");
      return `${index + 1}. ${module.title}: ${module.summary}\n${lessons}\n      Unit project: ${module.project}`;
    })
    .join("\n\n");
  const sourceLines = course.sources.map((source) => `- ${source.label}: ${source.url}`).join("\n");

  return [
    `Create an in-depth ${course.level.toLowerCase()} course named "${course.title}".`,
    `Audience: ${course.audience}.`,
    `Course purpose: ${course.description}`,
    `Why this needs to be well made: ${course.whyItWorks}`,
    "",
    "Build the course around this module arc:",
    moduleLines,
    "",
    `Capstone: ${course.capstone}`,
    "",
    "Use these public learning sources as inspiration and cite or name them when helpful:",
    sourceLines,
    "",
    "Make the final course interactive, specific, and practice-heavy. Include misconceptions, worked examples, checkpoints, review prompts, and applied projects.",
  ].join("\n");
}
