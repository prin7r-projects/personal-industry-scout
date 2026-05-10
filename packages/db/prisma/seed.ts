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
      where: { id: cite.citeId },
      update: {},
      create: {
        id: cite.citeId,
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

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
