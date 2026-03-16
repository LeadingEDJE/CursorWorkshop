Perfect, I have everything I need. Let me share my brainstormed outline for your afternoon portion. This is structured as concrete modules with specific inputs, outputs, and requirements.

---

# Manager AI Training - Afternoon Session Outline

## Module 1: Context Engineering for Managers (30-40 minutes)

**Objective:** Teach them that the same context engineering principles developers use apply to management tasks - just with different inputs.

### Part 1A: The Atlassian MCP Setup (10 minutes)

**What you do:**

- Live walkthrough of configuring the Atlassian MCP in Cursor
- Show them where the config lives and what permissions it needs

**Key callout:** The MCP can pull Jira tickets and linked Confluence pages, but NOT attachments or images. If their teams do UI work, they need to know this limitation upfront.

**Output:** Everyone has Atlassian MCP configured and working.

---

### Part 1B: "Context is King" Demo - Epic Summary (20-30 minutes)

**Setup:** Pull up a real completed or in-progress A&F epic with multiple linked stories and Confluence pages.

**Demo progression:**

1. **Bad prompt (no context):**
  ```
   Summarize the status of Project X
  ```
   Show how this fails or hallucinates because the model has no information.
2. **Mediocre prompt (manual context):**
  ```
   Here's a list of our Jira tickets: [paste titles and statuses]
   Summarize the status.
  ```
   Works, but tedious and loses detail.
3. **Good prompt (MCP-powered):**
  ```
   Use the Atlassian MCP to pull epic ANF-12345 and all linked stories.
   Summarize:
   - Overall completion percentage
   - What's blocked and why
   - What's at risk of missing the sprint
   - Key decisions documented in linked Confluence pages
  ```
   Show how the MCP pulls structured data and the summary is actually useful.
4. **Great prompt (with persona and output format):**
  ```
   Use the Atlassian MCP to pull epic ANF-12345 and all linked stories.

   You are helping me prepare for a stakeholder update meeting with non-technical business partners.

   Create a summary that includes:
   - A 2-sentence executive summary suitable for a VP
   - Completion status (% done, stories remaining)
   - Top 3 risks or blockers, with plain-English explanations
   - Any scope changes since the epic was created
   - Recommended talking points if asked "when will this ship?"

   Format this as bullet points I can paste into an email.
  ```

**Key teaching point:** Each version adds more context - about the data source, the audience, the purpose, and the desired output format. This is the same principle as Agents.md files, just applied to management tasks.

**Output for attendees:** Understanding that "context engineering" isn't just a developer thing - it's about giving the AI the right inputs to produce useful outputs.

---

## Module 2: AI as Thought Partner (45-60 minutes)

**Objective:** Show how to use AI for interactive brainstorming, devil's advocacy, and decision-making support.

### Part 2A: The Persona Pattern (15 minutes)

**Concept:** Instead of asking AI a question, give it a role that changes how it responds.

**Live demo in Cursor (or Copilot 365 if you want to show both):**

**Scenario:** You're planning a new initiative and want to stress-test your assumptions.

**Demo progression:**

1. **Single persona:**
  ```
   You are a skeptical senior engineer who has seen many projects fail due to scope creep.

   I'm proposing we migrate our checkout service to a new architecture. The timeline is 6 months with a team of 4.

   Ask me the hard questions you'd ask in a planning meeting. Be direct. Challenge my assumptions. Don't accept vague answers.
  ```
   Show how this creates a back-and-forth dialogue where they have to defend their thinking.
2. **Multiple personas (Ajay's devil's advocate request):**
  ```
   I want you to simulate a planning review with three perspectives:

   PERSONA 1 - "The Pragmatist": A senior EM who cares about delivery predictability and team sustainability
   PERSONA 2 - "The Architect": A principal engineer who cares about technical debt and long-term maintainability  
   PERSONA 3 - "The Business Partner": A product director who cares about customer impact and competitive timing

   I'll present my plan, and you'll respond as each persona in turn, clearly labeled. Each persona should ask 1-2 pointed questions from their perspective.

   Here's my plan: [description]
  ```

**Key teaching point:** The persona pattern works because it gives the model a specific lens to evaluate through. "Give me feedback" is weak. "Give me feedback as a skeptical security engineer" is strong.

---

### Part 2B: Annual Review Coaching (20-25 minutes)

**This directly addresses Collin's request.**

**Scenario:** Create a fake employee profile (you can make this lightly humorous to keep energy up - "Alex is a solid performer who thinks they're a top performer and will definitely ask about promotion timeline").

**Demo:**

```
I'm preparing for an annual review conversation with a direct report. Here's context about them:

EMPLOYEE CONTEXT:
- Name: Alex (fictional)
- Role: Senior Software Engineer, 3 years at A&F
- Performance: Meets expectations, strong technically, struggles with cross-team communication
- Their likely expectations: Believes they're ready for Staff promotion
- Recent wins: Led the checkout optimization project
- Recent challenges: Conflict with QA team over testing standards
- My actual assessment: Not ready for Staff yet, needs 6-12 months working on influence skills

YOUR ROLE:
Act as a coaching partner. First, ask me questions Alex is likely to ask during this review - especially the uncomfortable ones. After I respond to each question, give me brief feedback on my answer: Was it clear? Did it avoid the hard truth? How might Alex hear it vs. how I intended it?

Start with the question Alex will probably open with.
```

**Show the back-and-forth:** Let it ask a question, give a mediocre answer on purpose, show how the AI coaches you to be more direct or more empathetic.

**Key teaching point:** AI works well for rehearsal because you can practice the uncomfortable conversation without the stakes. The prompt engineering here is about setting up the scenario with enough specificity that the AI can roleplay realistically.

---

### Part 2C: Interactive Brainstorming Session (15-20 minutes)

**Let them try it themselves.**

**Exercise:** Have them think of a real decision or plan they're wrestling with (could be technical, organizational, process-related). 

Give them a template:

```
I'm trying to decide/plan [specific thing].

Context:
- Current situation: [what's happening now]
- Constraints: [timeline, budget, team capacity, political realities]
- Stakeholders who care: [who and why]
- What I'm leaning toward: [current thinking]
- What worries me: [concerns or unknowns]

Help me think through this by:
1. First, ask me 3 clarifying questions about aspects I might not have considered
2. After I answer, give me 2-3 alternative approaches I might not have thought of
3. For each alternative, tell me who would hate it and why

Let's start with your clarifying questions.
```

**Give them 10 minutes to try this with their own scenario.** Walk around, help people who are stuck.

**Debrief:** Ask 2-3 people to share what the AI surfaced that they hadn't considered.

---

## Module 3: Practical Manager Workflows (45-60 minutes)

**Objective:** Show specific, immediately-usable workflows for their day-to-day work.

### Part 3A: Sprint Analysis and Retrospective Prep (20 minutes)

**Setup:** Use a real recently-closed sprint.

**Demo prompt:**

```
Use the Atlassian MCP to pull all tickets from sprint "Sprint 24.3 - Checkout Team" that closed last week.

Analyze this sprint and help me prepare for the retrospective:

1. DELIVERY ANALYSIS:
   - What was committed vs. delivered?
   - What carried over and why (look at ticket comments for context)?
   - Were story point estimates accurate? Which tickets took longer than expected?

2. PATTERN DETECTION:
   - Are there repeated blockers across multiple tickets?
   - Did any tickets get re-opened or have significant scope changes mid-sprint?
   - Which team members were overloaded (assigned to too many tickets)?

3. RETRO TALKING POINTS:
   - What should we celebrate?
   - What's a process issue we should discuss (not blame individuals)?
   - What's one thing we could experiment with next sprint?

Format this so I can paste sections directly into our retro Confluence page.
```

**Key teaching point:** The AI can synthesize patterns across many tickets that would take you an hour to manually review. But you need to tell it what patterns to look for.

---

### Part 3B: Generating Documentation and Diagrams (20 minutes)

**This addresses Gauri's request directly.**

**Scenario:** You need to understand a system your team owns but you didn't build.

**Demo - Using Cursor with codebase context:**

Show that even though they're not writing code, they can open a repo in Cursor and ask:

```
I'm an engineering manager who just inherited this codebase. I need to understand it at an architecture level, not implementation detail.

Create a Mermaid diagram showing:
1. The main services/components and what each one does (one sentence per component)
2. How they communicate (HTTP, events, database, etc.)
3. External dependencies (third-party APIs, databases, caches)

Keep the diagram high-level - I'll share this with my director who doesn't need to see individual classes.
```

**Show the Mermaid output, then show how to paste it into Confluence** (Confluence renders Mermaid natively in code blocks).

**Second prompt - improving the diagram:**

```
This is helpful. Now add:
- Color coding: green for services we own, yellow for shared services, red for external dependencies
- A note on each external dependency about who owns the relationship/contract
```

**Key teaching point:** You don't need to read code to use Cursor for understanding systems. The AI reads the code; you ask architecture-level questions.

---

### Part 3C: Stakeholder Communication (15-20 minutes)

**Demo - turning technical tickets into executive updates:**

```
Use the Atlassian MCP to pull epic ANF-54321 (the payment processing migration).

I need to send an update to my VP who is non-technical. They care about:
- Are we on track for the Q3 deadline?
- What are the risks to the business (not technical risks - business impact)?
- Do we need any decisions or support from leadership?

Write a 4-5 sentence update email that:
- Leads with the bottom line (on track / at risk / blocked)
- Translates technical blockers into business language
- Ends with a specific ask or "no action needed"

Don't use jargon like "API," "microservice," or "latency" - translate everything.
```

**Show the output, then show a refinement:**

```
This is good but too optimistic. We're actually nervous about the timeline. 
Rewrite to be honest about the risk without sounding like we're making excuses.
Tone: confident but realistic.
```

**Key teaching point:** AI is excellent at translation between technical and business language. But you have to tell it who the audience is and what they care about.

---

## Module 4: Understanding Your Developers' Tools (20-30 minutes)

**Objective:** Give them enough familiarity with Plan/Agent/Ask modes that they can have informed conversations with their teams about AI-assisted development.

**This is NOT teaching them to code - it's teaching them what their developers are doing.**

### Demo: The Same Task in Three Modes

**Setup:** A simple, visual change in a codebase they can follow conceptually (e.g., "add a new field to this form").

**Show:**

1. **Ask Mode:** "How would I add a phone number field to this form?"
  - Point: This just gives information. Good for learning, not for doing.
2. **Plan Mode:** Same request.
  - Point: This creates a plan and asks for approval before doing anything. Show the plan, talk through how a developer would review it. Good for complex changes where you want to think before acting.
3. **Agent Mode:** Same request.
  - Point: This just goes and does it. Fast, but you better trust it. Good for experienced devs who can quickly review the output.

**Key teaching point for managers:** If your developer says "I let the agent do it," that's fine - but they should be reviewing the output. If they say "I used plan mode and reviewed each step," that's more careful but slower. Neither is wrong; it depends on the complexity and risk of the change.

**What they should ask their teams:**

- "What mode do you typically use for this kind of work?"
- "How do you review what the AI generated?"
- "What guardrails do you have?" (tests, PR reviews, etc.)

---

## Module 5: Prompt Library Workshop (30-40 minutes)

**Objective:** They leave with a personalized set of prompts they can use immediately.

**Format:** Give them a template document with prompt skeletons for common manager tasks. They fill in the blanks with their specific context.

### Prompt Templates to Provide:

**1. Epic/Project Status Summary:**

```
Use the Atlassian MCP to pull [EPIC_ID].

Summarize for [AUDIENCE: my director / my VP / the business stakeholder].
They care most about: [THEIR TOP CONCERN].
Tone: [FORMAL / CASUAL / URGENT].

Include: [CHECKLIST OF WHAT THEY WANT]
- Overall status
- Timeline confidence
- Risks
- Blockers
- Decisions needed

Format as: [EMAIL / BULLET POINTS / SLIDE TALKING POINTS].
```

**2. Sprint Retrospective Prep:**

```
Analyze sprint [SPRINT_NAME].

Focus on:
- Delivery vs. commitment
- Patterns in blockers
- Estimation accuracy

Help me prepare retro discussion points that:
- Don't blame individuals
- Focus on process improvements
- Include one thing to celebrate
```

**3. Thought Partner / Decision Support:**

```
I'm deciding between [OPTION A] and [OPTION B].

Context: [SITUATION]
Constraints: [LIMITS]
Stakeholders: [WHO CARES AND WHY]

First, ask me 3 questions to clarify my thinking.
Then give me a framework for deciding.
Then tell me what I'm probably not considering.
```

**4. 1:1 Prep:**

```
I'm preparing for a 1:1 with [ROLE/LEVEL].

Recent context:
- Their recent work: [SUMMARY]
- Any tensions or concerns: [ISSUES]
- What I want to discuss: [TOPICS]

Help me:
- Frame feedback constructively
- Prepare for pushback on [SENSITIVE TOPIC]
- Identify questions to ask them to understand their perspective
```

**5. Technical Concept Translation:**

```
Explain [TECHNICAL CONCEPT] in a way that:
- A non-technical VP could understand
- Takes 30 seconds to read
- Focuses on business impact, not implementation
- Uses an analogy if helpful
```

**6. Review Coaching:**

```
I'm preparing for a performance review conversation.

Employee context: [DETAILS]
My assessment: [SUMMARY]
Difficult message I need to deliver: [THE HARD THING]

Act as my coach. Ask me questions the employee is likely to ask, especially uncomfortable ones. After I answer each, tell me how it might land and how to improve.
```

**Exercise:** Give them 15 minutes to customize 2-3 of these for their actual work. Then share one with the group.

---

## Suggested Afternoon Timeline


| Time    | Duration | Module                                                                   |
| ------- | -------- | ------------------------------------------------------------------------ |
| 1:00 PM | 10 min   | Atlassian MCP setup                                                      |
| 1:10 PM | 30 min   | Context Engineering demo (Epic Summary progression)                      |
| 1:40 PM | 15 min   | Break                                                                    |
| 1:55 PM | 45 min   | Thought Partner module (Personas, Review Coaching, Interactive Exercise) |
| 2:40 PM | 20 min   | Sprint Analysis demo                                                     |
| 3:00 PM | 20 min   | Diagrams and Documentation demo                                          |
| 3:20 PM | 15 min   | Break                                                                    |
| 3:35 PM | 20 min   | Developer Tools Overview (Plan/Agent/Ask)                                |
| 3:55 PM | 35 min   | Prompt Library Workshop                                                  |
| 4:30 PM | -        | Buffer / Q&A / Overflow                                                  |


Total: ~3.5 hours of content, with ~30 min buffer. You'll likely not need all of it, which gives you flexibility to go deeper on what resonates.

---

## Key Themes to Reinforce Throughout

1. **Context is transferable:** The same principles that make a good Agents.md file make a good management prompt - specificity about role, audience, constraints, and desired output format.
2. **AI is a tool, not a replacement for judgment:** Every output needs human review. The AI synthesizes and drafts; you decide and refine.
3. **The prompt is the product:** Time spent crafting a good prompt pays off immediately. A 2-minute prompt investment can save 30 minutes of back-and-forth.
4. **Know the limitations:** MCP doesn't pull attachments. Models hallucinate when they lack context. Sensitive data (performance reviews) shouldn't go into tools without understanding where it's stored.
5. **Your developers are using these tools:** Understanding how Plan/Agent/Ask modes work helps you have better conversations about velocity, quality, and process with your teams.

---

## Leave-Behind Materials

Include in your slide deck:

1. The prompt templates from Module 5 (editable versions)
2. MCP setup instructions with screenshots
3. A "Context Engineering Checklist" - a simple list of questions to ask yourself before prompting:
  - What does the AI need to know to do this well?
  - Who is the audience for the output?
  - What format do I need the output in?
  - What's my role and what's the AI's role?
  - What should the AI NOT do or assume?
4. Links to follow-up resources (your Teams channel, internal wiki pages)

---

Does this give you what you need? I can go deeper on any module, or help you think through specific demos if you want to workshop the exact A&F data you'll use.