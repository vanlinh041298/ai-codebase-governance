import './App.css'

const featureGroups = [
  {
    number: '01',
    skill: '/engineeringandsecurity',
    title: 'Standardize repositories',
    description: 'Owns engineering standards, secure defaults, and shared AI instructions.',
    features: [
      'Create and maintain the shared AGENTS.md rulebook',
      'Enforce secure coding and dependency policies',
      'Standardize repository and deployment conventions',
      'Synchronize instructions across AI coding tools',
    ],
  },
  {
    number: '02',
    skill: '/securitygates',
    title: 'Automate security gates',
    description: 'Block risky AI-generated changes before they reach main.',
    features: [
      'Scan pull requests with Gitleaks',
      'Run Semgrep static analysis',
      'Audit dependencies and containers with Trivy',
      'Keep all required checks visible in the pull request',
    ],
  },
  {
    number: '03',
    skill: '/parallelagents',
    title: 'Run agents in parallel',
    description: 'Isolate tasks so multiple agents can work without file collisions.',
    features: [
      'Create one Git worktree per task',
      'Assign a unique local development port',
      'Install dependencies automatically',
      'Launch an optional agent command in the worktree',
    ],
  },
  {
    number: '04',
    skill: '/governancereview',
    title: 'Protect core branches',
    description: 'Make reviews and branch rules deterministic across the team.',
    features: [
      'Require pull requests before merging',
      'Require reviewer and CODEOWNERS approval',
      'Dismiss stale approvals after new commits',
      'Notify core reviewers when a pull request is ready',
    ],
  },
]

const workflowSteps = [
  'Copy the shared governance files into the target repository.',
  'Replace CODEOWNERS placeholders with real GitHub usernames.',
  'Enable branch protection and required status checks.',
  'Create an isolated worktree with scripts/wt-agent.sh.',
  'Implement, validate, and open a reviewable pull request.',
]

function App() {
  return (
    <main>
      <header className="hero">
        <div className="eyebrow">
          <span className="status-dot" />
          Open source · agent ready
        </div>
        <h1>Governance Runbook</h1>
        <p className="hero-copy">
          Reusable, MIT-licensed workflows that any team or AI coding agent can
          adopt, customize, and run across repositories.
        </p>
        <div className="hero-actions">
          <a href="#features">Explore features</a>
          <a className="secondary" href="#workflow">View workflow</a>
        </div>
      </header>

      <section className="summary" aria-label="Runbook summary">
        <div><strong>4</strong><span>portable skills</span></div>
        <div><strong>MIT</strong><span>open license</span></div>
        <div><strong>3</strong><span>security gates</span></div>
        <div><strong>Any</strong><span>team or agent</span></div>
      </section>

      <section id="features" className="content-section">
        <div className="section-heading">
          <p className="kicker">Available skills</p>
          <h2>Delegate governance work with focused skills</h2>
        </div>
        <div className="feature-grid">
          {featureGroups.map((group) => (
            <article className="feature-card" key={group.number}>
              <div className="feature-meta">
                <span className="feature-number">{group.number}</span>
                <code>{group.skill}</code>
              </div>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
              <ul>
                {group.features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="adapt">
        <div className="section-heading">
          <p className="kicker">Easy to adopt</p>
          <h2>Start with templates, keep only what fits</h2>
        </div>
        <div className="adapt-grid">
          <article>
            <span>1</span>
            <h3>Copy</h3>
            <p>Bring AGENTS.md, skills, workflows, and scripts into any repository.</p>
          </article>
          <article>
            <span>2</span>
            <h3>Customize</h3>
            <p>Replace reviewer identities, project commands, paths, checks, and secrets.</p>
          </article>
          <article>
            <span>3</span>
            <h3>Delegate</h3>
            <p>Give the matching skill to a human maintainer or compatible AI agent.</p>
          </article>
        </div>
      </section>

      <section id="workflow" className="workflow">
        <div className="section-heading">
          <p className="kicker">Rollout workflow</p>
          <h2>From local worktree to protected production branch</h2>
        </div>
        <ol>
          {workflowSteps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}

export default App
