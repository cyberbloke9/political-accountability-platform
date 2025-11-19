# 🚀 Quick Start Guide

## Step 1: Verify Your Setup

Check that you're authenticated:
```bash
puttamachine auth status
```

## Step 2: Navigate to Project

```bash
cd "C:\Users\Prithvi Putta\Desktop\political-accountability-platform"
```

## Step 3: Choose Your Approach

### Option A: Full Automated Build (3 hours)

Run all 9 agents to build the complete platform:

```bash
puttamachine start
```

**What happens:**
- ✅ Founder Architect creates system architecture
- ✅ Data Architect designs database schemas
- ✅ Behavior Architect implements business logic
- ✅ Operational Architect builds API
- ✅ UI/UX Architect creates frontend
- ✅ Verification system implemented
- ✅ Gamification features added
- ✅ Tests created
- ✅ Documentation generated

**You'll see output like:**
```
🤖 Starting workflow execution...
📋 Step 1/9: founder-architect
   Creating architecture documents...
   ✅ docs/architecture.md created
   ✅ docs/database-schema.md created
   ...
```

### Option B: Step-by-Step (Recommended for Learning)

Run one agent at a time to see how each works:

```bash
# Step 1: Architecture
puttamachine step founder-architect

# Step 2: Database Design
puttamachine step structural-data-architect

# Step 3: Business Logic
puttamachine step behavior-architect

# And so on...
```

### Option C: Test with a Custom Prompt

Try a single task:

```bash
puttamachine step founder-architect "Read the specification in .puttamachine/inputs/specifications.md and create a system architecture document in docs/architecture.md. Focus on the verification system design."
```

## Step 4: Monitor Progress

Watch the agents work in real-time:

```bash
# In another terminal, view logs
puttamachine agents logs

# List all agents
puttamachine agents list
```

## Step 5: After Completion

Once the workflow finishes:

1. **Check Generated Files**
   ```bash
   ls -R
   ```

2. **Review Code**
   ```bash
   cat backend/src/app.js
   cat frontend/src/pages/index.jsx
   ```

3. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Set Up Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your database credentials
   ```

5. **Run Migrations**
   ```bash
   cd backend && npm run migrate
   ```

6. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

7. **Open in Browser**
   ```
   http://localhost:3000
   ```

## 🎯 Expected Results

After the workflow completes, you'll have:

```
political-accountability-platform/
├── backend/
│   ├── src/
│   │   ├── app.js                 (Express server)
│   │   ├── routes/                (API endpoints)
│   │   ├── controllers/           (Request handlers)
│   │   ├── services/              (Business logic)
│   │   │   ├── verification-pipeline.service.js
│   │   │   ├── scoring.service.js
│   │   │   ├── quality-assessment.service.js
│   │   │   └── fraud-detection.service.js
│   │   ├── models/                (Database models)
│   │   └── middleware/            (Auth, validation)
│   ├── database/
│   │   ├── schema.sql             (PostgreSQL schema)
│   │   └── migrations/            (DB migrations)
│   ├── tests/                     (Backend tests)
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.jsx          (Landing page)
│   │   │   ├── promises/          (Promise pages)
│   │   │   ├── verify/            (Verification)
│   │   │   ├── leaderboard.jsx    (Citizen scores)
│   │   │   └── profile/           (User profiles)
│   │   ├── components/
│   │   │   ├── PromiseCard.jsx
│   │   │   ├── VerificationForm.jsx
│   │   │   ├── QualityMetrics.jsx
│   │   │   ├── CitizenScore.jsx
│   │   │   └── EvidenceGallery.jsx
│   │   ├── hooks/
│   │   └── services/
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── README.md
├── docs/
│   ├── architecture.md            (System design)
│   ├── api-design.md              (API documentation)
│   ├── database-schema.md         (DB structure)
│   ├── security-strategy.md       (Auth & security)
│   ├── testing-strategy.md        (Test plan)
│   ├── deployment.md              (Deploy guide)
│   └── user-guide.md              (End-user docs)
├── tests/
│   └── e2e/                       (End-to-end tests)
├── .puttamachine/
│   ├── political-accountability.workflow.js
│   └── inputs/
│       └── specifications.md
├── Dockerfile
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci-cd.yml
└── README.md
```

## 🔍 Troubleshooting

### Agent Fails or Gets Stuck

```bash
# Stop the workflow
Ctrl+C

# Check agent logs
puttamachine agents logs

# Resume from specific step
puttamachine step <agent-name> "<prompt>"
```

### Need to Modify Workflow

Edit the workflow file:
```bash
code .puttamachine/political-accountability.workflow.js
```

Then run again:
```bash
puttamachine start
```

### Check Agent Status

```bash
# See all registered agents
puttamachine agents list

# View specific agent output
puttamachine agents logs --agent founder-architect
```

## 💡 Tips

1. **Let It Run**: The workflow takes ~3 hours. Let it complete.
2. **Monitor Logs**: Keep an eye on progress in another terminal
3. **Review Code**: AI-generated code needs human review
4. **Customize**: Adjust branding, styling, features after completion
5. **Test Thoroughly**: Run all tests before deploying

## 🎓 Learning Mode

To understand each agent:

```bash
# Run one, review output, then next
puttamachine step founder-architect
# Wait for completion, review docs/

puttamachine step structural-data-architect
# Wait, review backend/database/

# And so on...
```

## 📚 Additional Resources

- **Full Specification**: `.puttamachine/inputs/specifications.md`
- **Workflow Code**: `.puttamachine/political-accountability.workflow.js`
- **Agent Config**: `config/sub.agents.js`
- **PuttaMachine Docs**: `puttamachine --help`

---

**Ready? Let's build! 🚀**

```bash
puttamachine start
```
