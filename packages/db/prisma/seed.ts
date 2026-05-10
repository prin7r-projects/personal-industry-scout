import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // Create a scout
  const scout = await prisma.scout.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "J. Marsh",
      industryFocus: "vertical-saas",
    },
  });
  console.log(`  Scout: ${scout.name}`);

  // Create a test subscriber
  const subscriber = await prisma.subscriber.upsert({
    where: { email: "test@personalindustryscout.com" },
    update: {},
    create: {
      email: "test@personalindustryscout.com",
      name: "Test Subscriber",
      tz: "America/New_York",
    },
  });
  console.log(`  Subscriber: ${subscriber.email}`);

  // Create a subscription
  const subscription = await prisma.subscription.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      subscriberId: subscriber.id,
      tier: "operator",
      status: "active",
    },
  });
  console.log(`  Subscription: ${subscription.tier}`);

  // Create a watchlist
  const watchlist = await prisma.watchlist.upsert({
    where: { subscriberId: subscriber.id },
    update: {},
    create: {
      subscriberId: subscriber.id,
      industries: ["vertical-saas", "fintech-infra"],
      companies: ["ServiceTitan", "Toast"],
      geos: ["NA"],
    },
  });
  console.log(`  Watchlist: ${(watchlist.industries as string[]).join(", ")}`);

  // Create a sample brief
  const brief = await prisma.brief.upsert({
    where: { id: "00000000-0000-0000-0000-000000000100" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000100",
      industry: "vertical-saas",
      isoweek: 202619,
      scoutId: scout.id,
      status: "signed",
      signedAt: new Date("2026-05-04T09:42:00Z"),
      bodyMd: `# Vertical SaaS — Week 19, 2026

## Deal
ServiceTitan closed a \$120M growth round at a flat valuation of \$9.5B. The round was led by Insight Partners with participation from existing investors. The capital will fund expansion into adjacent verticals including HVAC and plumbing supply chain.

## Deal
Toast acquired a small restaurant analytics startup for an undisclosed sum, estimated at \$45-60M. The acquisition brings in a team of 12 data scientists focused on predictive demand modeling for multi-location restaurant groups.

## Hire
Daniela Reyes joined ServiceTitan as Chief Product Officer from Shopify, where she led POS product. Her mandate includes unifying the field-service and back-office product lines.

## Reg
The EU's Data Act came into force on May 2, requiring vertical SaaS vendors serving EU customers to provide real-time data access APIs. Compliance deadline is November 2026.`,
    },
  });
  console.log(`  Brief: ${brief.industry} W${brief.isoweek} (${brief.status})`);

  // Create citations for the brief
  const citations = [
    {
      briefId: brief.id,
      citeId: "C-2026W19-0001",
      url: "https://techcrunch.com/2026/05/02/servicetitan-120m-growth-round/",
      title: "ServiceTitan closes $120M growth round at flat $9.5B valuation",
    },
    {
      briefId: brief.id,
      citeId: "C-2026W19-0002",
      url: "https://www.theinformation.com/articles/toast-acquires-restaurant-analytics-startup",
      title: "Toast Acquires Restaurant Analytics Startup in $45-60M Deal",
    },
    {
      briefId: brief.id,
      citeId: "C-2026W19-0003",
      url: "https://www.linkedin.com/feed/update/daniela-reyes-joins-servicetitan",
      title: "Daniela Reyes Joins ServiceTitan as CPO",
    },
    {
      briefId: brief.id,
      citeId: "C-2026W19-0004",
      url: "https://eur-lex.europa.eu/eli/reg/2023/2854/oj",
      title: "EU Data Act — Regulation (EU) 2023/2854",
    },
  ];

  for (const cite of citations) {
    await prisma.citation.upsert({
      where: { id: citationIds[cite.citeId] },
      update: {},
      create: {
        id: citationIds[cite.citeId],
        ...cite,
        verifiedAt: new Date("2026-05-04T09:30:00Z"),
      },
    });
  }
  console.log(`  Citations: ${citations.length}`);

  // Create a test user with workspace and asset
  const user = await prisma.user.upsert({
    where: { email: "dev@prin7r.com" },
    update: {},
    create: {
      email: "dev@prin7r.com",
      name: "Dev User",
    },
  });
  console.log(`  User: ${user.email}`);

  const workspace = await prisma.workspace.upsert({
    where: { id: "00000000-0000-0000-0000-000000000200" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000200",
      name: "Default Workspace",
      ownerId: user.id,
    },
  });
  console.log(`  Workspace: ${workspace.name}`);

  const asset = await prisma.asset.upsert({
    where: { id: "00000000-0000-0000-0000-000000000300" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000300",
      workspaceId: workspace.id,
      userId: user.id,
      name: "sample-brief.pdf",
      type: "document",
      url: "https://storage.example.com/sample-brief.pdf",
    },
  });
  console.log(`  Asset: ${asset.name} (${asset.type})`);

  const benchmarks = [
    {
      id: "00000000-0000-0000-0000-000000000401",
      name: "MMLU",
      category: "accuracy",
      description: "Broad multitask language understanding across academic and professional domains.",
    },
    {
      id: "00000000-0000-0000-0000-000000000402",
      name: "GPQA Diamond",
      category: "reasoning",
      description: "Graduate-level science questions designed to test difficult expert reasoning.",
    },
    {
      id: "00000000-0000-0000-0000-000000000403",
      name: "HumanEval",
      category: "quality",
      description: "Python coding task completion benchmark for functional correctness.",
    },
    {
      id: "00000000-0000-0000-0000-000000000404",
      name: "SWE-bench Verified",
      category: "quality",
      description: "Repository-level software engineering fixes validated against real issue patches.",
    },
    {
      id: "00000000-0000-0000-0000-000000000405",
      name: "GSM8K",
      category: "reasoning",
      description: "Grade-school math word problems that measure stepwise arithmetic reasoning.",
    },
    {
      id: "00000000-0000-0000-0000-000000000406",
      name: "MATH",
      category: "reasoning",
      description: "Competition-style math problems spanning algebra, geometry, counting, and calculus.",
    },
    {
      id: "00000000-0000-0000-0000-000000000407",
      name: "BBH",
      category: "reasoning",
      description: "Big-Bench Hard tasks focused on multi-step reasoning and instruction following.",
    },
    {
      id: "00000000-0000-0000-0000-000000000408",
      name: "DROP",
      category: "accuracy",
      description: "Discrete reasoning over paragraphs with arithmetic and span extraction.",
    },
    {
      id: "00000000-0000-0000-0000-000000000409",
      name: "HellaSwag",
      category: "accuracy",
      description: "Commonsense natural language inference for completing everyday scenarios.",
    },
    {
      id: "00000000-0000-0000-0000-000000000410",
      name: "TruthfulQA",
      category: "safety",
      description: "Truthfulness benchmark targeting common misconceptions and imitative falsehoods.",
    },
    {
      id: "00000000-0000-0000-0000-000000000411",
      name: "RealToxicityPrompts",
      category: "safety",
      description: "Safety benchmark measuring toxic continuation risk from challenging prompts.",
    },
    {
      id: "00000000-0000-0000-0000-000000000412",
      name: "MT-Bench",
      category: "quality",
      description: "Multi-turn chat quality benchmark for helpfulness and instruction adherence.",
    },
  ];

  const scoreMatrix: Record<string, Record<string, number>> = {
    "MMLU": { "frontier": 88.7, "open-weight": 82.4, "cost-efficient": 76.1 },
    "GPQA Diamond": { "frontier": 61.2, "open-weight": 48.5, "cost-efficient": 39.8 },
    "HumanEval": { "frontier": 92.1, "open-weight": 86.4, "cost-efficient": 79.3 },
    "SWE-bench Verified": { "frontier": 48.6, "open-weight": 33.2, "cost-efficient": 21.7 },
    "GSM8K": { "frontier": 96.8, "open-weight": 91.5, "cost-efficient": 84.9 },
    "MATH": { "frontier": 73.4, "open-weight": 59.2, "cost-efficient": 46.6 },
    "BBH": { "frontier": 87.3, "open-weight": 78.1, "cost-efficient": 69.4 },
    "DROP": { "frontier": 86.2, "open-weight": 80.8, "cost-efficient": 73.5 },
    "HellaSwag": { "frontier": 95.6, "open-weight": 92.7, "cost-efficient": 88.4 },
    "TruthfulQA": { "frontier": 76.5, "open-weight": 69.1, "cost-efficient": 61.8 },
    "RealToxicityPrompts": { "frontier": 3.8, "open-weight": 6.9, "cost-efficient": 9.7 },
    "MT-Bench": { "frontier": 9.4, "open-weight": 8.1, "cost-efficient": 7.2 },
  };

  for (const benchmarkSeed of benchmarks) {
    const benchmark = await prisma.benchmark.upsert({
      where: { name: benchmarkSeed.name },
      update: {
        description: benchmarkSeed.description,
        category: benchmarkSeed.category,
      },
      create: benchmarkSeed,
    });

    for (const [industry, value] of Object.entries(scoreMatrix[benchmark.name])) {
      await prisma.score.upsert({
        where: {
          benchmarkId_industry: {
            benchmarkId: benchmark.id,
            industry,
          },
        },
        update: {
          value,
          unit: benchmark.name === "MT-Bench" ? "ratio" : "percent",
        },
        create: {
          benchmarkId: benchmark.id,
          industry,
          value,
          unit: benchmark.name === "MT-Bench" ? "ratio" : "percent",
        },
      });
    }
  }
  console.log(`  Benchmarks: ${benchmarks.length}`);
  console.log(`  Scores: ${benchmarks.length * 3}`);

  console.log("✅ Seed complete.");
}

const citationIds: Record<string, string> = {
  "C-2026W19-0001": "00000000-0000-0000-0000-000000000101",
  "C-2026W19-0002": "00000000-0000-0000-0000-000000000102",
  "C-2026W19-0003": "00000000-0000-0000-0000-000000000103",
  "C-2026W19-0004": "00000000-0000-0000-0000-000000000104",
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
