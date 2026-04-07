# Afternoon Session Trainer Handout

This handout focuses on two Cursor exercises that participants will run against their own repositories:

1. Add a feature
2. Upgrade from .NET 8 to .NET 10

The session is designed to teach a repeatable Cursor workflow:

1. Plan first
2. Execute second
3. Verify third

It is intentionally written so it still works when a participant's environment cannot fully restore, build, or test.

## Session Goals

By the end of the session, attendees should be able to:

- use Cursor to analyze a real codebase before editing
- build a scoped agent plan from a vague requirement
- execute a bounded feature change in a layered .NET solution
- use Cursor to inventory and de-risk a framework upgrade
- handle blocked restore/build scenarios without losing momentum

## Environment Constraint

Some participants may be working in environments with:

- private package feeds
- missing credentials
- unavailable secrets
- incomplete local setup
- services that cannot be run locally

That is acceptable for this class.

The objective is not "fully run the system no matter what." The objective is to show how Cursor still creates value through:

- codebase comprehension
- impact analysis
- implementation planning
- bounded code changes
- static verification
- precise next-step guidance

## Shared Cursor Operating Model

Use this sequence for both exercises.

### Stage 1: Plan

Ask Cursor to:

- inspect the codebase
- identify impacted files
- list existing constraints
- propose acceptance criteria
- produce an ordered implementation plan

Rule for attendees:

- do not allow code edits yet

### Stage 2: Execute

After the plan looks sound, ask Cursor to:

- implement the change
- keep scope bounded
- explain assumptions
- update tests where appropriate

### Stage 3: Verify

Ask Cursor to:

- run restore/build/test if possible
- if blocked, do static verification
- summarize changed files
- identify remaining risks
- list exact commands for a working environment

## Exercise 1: Add a Feature

### Feature Statement

Add a workflow that duplicates an existing active configuration into a new draft configuration so the business can make in-cycle edits without modifying the live version.

Required behavior:

- duplicate a source configuration by ID
- create a new draft version
- keep the copy non-active and non-deleted
- copy the associated child records or sub-configurations
- leave the source unchanged
- add or update tests

### Suggested Starting Point

Tell participants to identify the equivalent of these concepts in their own repo:

- the main controller or endpoint layer for the feature area
- the service or domain layer where business rules live
- the repository or data access layer
- request and response models
- unit or integration tests for the feature area

### Prompt 1: Planning

Paste into Cursor:

```text
Analyze this repo and design a bounded feature to duplicate an existing active configuration into a new draft configuration for safe in-cycle edits.

Do not edit yet.

I need:
1. The business and technical rules that already exist around active vs draft state, deletion state, and related records.
2. The minimum set of files that would need to change across controller or endpoint, service or domain, repository or data access, request or response models, and tests.
3. A step-by-step implementation plan in dependency order.
4. Proposed acceptance criteria.
5. Risks or ambiguities.

Assume the new behavior should:
- duplicate a source record by ID
- create a new draft, non-active, non-deleted record
- copy relevant child records or associations
- leave the source unchanged
- include automated tests
```

### Expected Planning Output

A strong response should include:

- existing rules already enforced in the codebase
- notes that lifecycle state must remain valid after the copy
- the need for a new endpoint, action, command, or service method
- a service-level duplication method
- repository support for reading the source with needed child data
- a naming or identifier strategy for the copied record
- tests for service behavior and endpoint behavior
- identified ambiguities such as source eligibility, naming collisions, and how deeply associations should be copied

A weak response usually:

- jumps straight to code
- does not identify impacted layers
- ignores existing business rules
- forgets tests

### Prompt 2: Refine the Plan

Paste into Cursor after reviewing the plan:

```text
Refine the plan with concrete implementation detail.

I want:
1. Proposed endpoint or command shape
2. Proposed request and response models
3. Exact files likely to change
4. The order the code should be written
5. The order the tests should be written

Do not edit yet.
Keep the feature bounded to duplication of the active record into a draft only.
```

### Expected Refinement Output

Look for:

- a clear endpoint or command proposal
- a bounded request shape
- a list of service, data access, model, and test files
- an explicit recommendation to write business-rule tests before endpoint tests

### Prompt 3: Execute

Paste into Cursor after approving the plan:

```text
Implement the approved duplication feature.

Requirements:
- Keep the feature bounded to duplication into a draft
- Add or update endpoint, service or domain, repository or data access logic, and tests
- Preserve existing business rules
- Explain any assumptions in your final summary
- Run the narrowest relevant tests if restore/build works
- If restore/build is blocked, perform static verification and report exactly what could not be executed
```

### Expected Execution Output

Cursor should:

- change only the files needed for the feature
- preserve current lifecycle rules
- add tests or update existing test coverage
- summarize assumptions instead of silently inventing behavior

### Prompt 4: Verify

Paste into Cursor after implementation:

```text
Review your implementation like a code reviewer.

I need:
1. Files changed
2. Acceptance criteria coverage
3. Any missing tests
4. Commands to run in a fully working environment
5. Residual risks
```

### Expected Verification Output

A strong response should include:

- changed file list
- which acceptance criteria are fully covered
- any untested behavior
- exact commands to restore, build, and test
- risks such as naming collisions, partial copy behavior, or edge cases around lifecycle state

## Exercise 2: Upgrade to .NET 10

### Upgrade Statement

Upgrade a .NET application from .NET 8 to .NET 10 and produce a practical migration result:

- project updates
- package review
- likely breakpoints
- validation steps

### Suggested Starting Point

Tell participants to locate:

- all `.csproj` files in the relevant solution
- any shared props or package-management files
- startup or hosting entry points
- auth and middleware configuration
- test projects
- any NuGet configuration or internal package references

### Prompt 1: Planning

Paste into Cursor:

```text
Analyze this repo for a .NET 8 to .NET 10 upgrade.

Do not edit yet.

I need:
1. A complete inventory of projects targeting net8.0.
2. A package inventory, grouped into likely safe upgrades vs likely risky or internal dependencies.
3. Code hotspots that may break or need review during a .NET 10 move.
4. A step-by-step upgrade plan ordered from safest to riskiest.
5. A verification plan, including what cannot be validated without access to internal dependencies or credentials.
```

### Expected Planning Output

A strong response should include:

- all projects targeting `net8.0`
- public package references grouped separately from internal packages
- likely review hotspots such as hosting, auth, Swagger, telemetry, Razor, middleware, and test infrastructure
- a staged plan that starts with inventory, then framework updates, then package review, then build and test
- clear mention that internal dependency access may block restore

### Prompt 2: Refine the Plan

Paste into Cursor after reviewing the first answer:

```text
Refine the .NET 10 migration plan.

I want:
1. Exact project files to update
2. Which public packages should be reviewed first
3. Which internal packages must be flagged without guessing compatibility
4. The exact order of restore, build, and test commands
5. The likely code files that may need edits after the framework change

Do not edit yet.
Keep the plan conservative.
```

### Expected Refinement Output

Look for:

- an exact list of `.csproj` files
- no invented compatibility claims for internal packages
- a conservative execution order
- an explicit statement that code changes should come only after restore or build reveals issues

### Prompt 3: Execute

Paste into Cursor after approving the plan:

```text
Execute the .NET 10 upgrade plan.

Requirements:
- Update target frameworks to net10.0 where appropriate
- Upgrade public package references conservatively
- Do not invent versions for internal packages if compatibility is unknown; flag them clearly
- Make only the smallest code changes needed to address obvious framework-level issues
- Attempt restore, build, and test if possible
- If restore fails due to environment or dependency access, stop at the highest-confidence migration state and summarize remaining blockers
```

### Expected Execution Output

Cursor should:

- update target frameworks cleanly
- treat public packages and internal packages differently
- avoid speculative edits unrelated to the upgrade
- attempt verification
- stop cleanly if restore is blocked

### Prompt 4: Verify

Paste into Cursor after implementation:

```text
Review the .NET 10 migration result.

I need:
1. Projects updated
2. Package changes made
3. Remaining blocked dependencies
4. Any code that still needs manual review
5. Exact restore, build, and test commands to run once the environment is fully available
```

### Expected Verification Output

A strong answer should include:

- all updated project files
- package changes actually made
- explicit mention of blocked internal dependencies
- likely remaining review areas
- exact validation commands

## Fallback Instructions When Restore or Build Is Blocked

If `dotnet restore`, `dotnet build`, or `dotnet test` fails because of environment issues, missing secrets, or unavailable internal dependencies, switch the class into fallback mode.

### Fallback Mode Goal

Produce an artifact that is still valuable:

- a high-confidence change plan
- a bounded implementation
- static verification
- explicit blockers
- exact next commands for a working environment

### Fallback Prompt

Paste into Cursor:

```text
Restore, build, or test is blocked in this environment.

Switch to fallback mode.

I need:
1. Static verification of the change set
2. A list of edited files and why each changed
3. Risks introduced by the current diff
4. What still cannot be validated without a working environment
5. The exact commands a developer should run once the environment is available
6. A short release-note style summary of the work completed
```

### Expected Fallback Output

Look for:

- no pretending that verification succeeded
- a precise list of what is known vs unknown
- exact commands for later execution
- a credible summary a teammate could continue from

## Useful Commands for Participants

These are good commands to ask Cursor to run or explain. Participants should adapt the paths to their own repo:

```text
dotnet restore path/to/solution.sln
dotnet build path/to/solution.sln
dotnet test path/to/solution.sln
dotnet restore path/to/application.csproj
dotnet build path/to/application.csproj
```

If restore is blocked, ask Cursor to summarize the failure clearly and continue in fallback mode.

## What Good Looks Like

By the end of the session, a strong participant outcome looks like this:

- they used Cursor to inspect before editing
- they got a concrete, layered implementation plan
- they executed a bounded change rather than a sprawling one
- they asked Cursor to verify, not just summarize
- when blocked, they extracted useful static analysis and next steps instead of stopping

## Optional Closing Prompt

Paste into Cursor at the end of class:

```text
Summarize what made the strongest prompts and workflows in these exercises.

I want:
1. The best prompt patterns we used
2. Common mistakes to avoid
3. A reusable three-step workflow for future real-world tasks in Cursor
4. A short checklist I can keep for future sessions
```
