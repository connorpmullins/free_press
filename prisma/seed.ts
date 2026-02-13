import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { createHash, randomBytes } from "crypto";

const connectionString = process.env.DATABASE_URL || "postgresql://freepress:freepress_dev@localhost:5432/freepress";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a stable 64-char hex dev token from a friendly name.
 * The "raw" token is the hex string itself (passes middleware regex).
 * The DB stores hash(raw). The cookie value is raw.
 */
function devToken(name: string): { raw: string; hashed: string } {
  // Derive a deterministic 32-byte hex string from the name
  const raw = createHash("sha256").update(`dev-session:${name}`).digest("hex");
  const hashed = hashToken(raw);
  return { raw, hashed };
}

async function main() {
  console.log("Seeding database...");

  // ============================================================
  // Platform Config
  // ============================================================
  await prisma.platformConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformMargin: 0.15,
      monthlyPrice: 500,
      annualPrice: 5000,
    },
  });

  // ============================================================
  // Admin User
  // ============================================================
  const admin = await prisma.user.upsert({
    where: { email: "admin@freepress.news" },
    update: {},
    create: {
      email: "admin@freepress.news",
      displayName: "Platform Admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  // Create session for admin
  const adminToken = devToken("admin");
  await prisma.session.upsert({
    where: { token: adminToken.hashed },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: admin.id,
      token: adminToken.hashed,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("  Created admin: admin@freepress.news");

  // ============================================================
  // Journalists
  // ============================================================
  const journalist1 = await prisma.user.upsert({
    where: { email: "elena.vasquez@example.com" },
    update: {},
    create: {
      email: "elena.vasquez@example.com",
      displayName: "Elena Vasquez",
      role: "JOURNALIST",
      emailVerified: true,
    },
  });

  await prisma.journalistProfile.upsert({
    where: { userId: journalist1.id },
    update: {},
    create: {
      userId: journalist1.id,
      pseudonym: "E.Vasquez",
      bio: "Investigative reporter covering government accountability and public finance. Former city hall reporter at the Tribune. Pulitzer finalist.",
      beats: ["Government", "Public Finance", "Accountability"],
      verificationStatus: "VERIFIED",
      reputationScore: 82.5,
      articleCount: 0,
    },
  });

  // Create session for journalist1
  const j1Token = devToken("journalist1");
  await prisma.session.upsert({
    where: { token: j1Token.hashed },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: journalist1.id,
      token: j1Token.hashed,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const journalist2 = await prisma.user.upsert({
    where: { email: "marcus.chen@example.com" },
    update: {},
    create: {
      email: "marcus.chen@example.com",
      displayName: "Marcus Chen",
      role: "JOURNALIST",
      emailVerified: true,
    },
  });

  await prisma.journalistProfile.upsert({
    where: { userId: journalist2.id },
    update: {},
    create: {
      userId: journalist2.id,
      pseudonym: "M.Chen",
      bio: "Technology and privacy reporter. Specializing in corporate surveillance, data brokers, and digital rights. 10+ years covering Silicon Valley.",
      beats: ["Technology", "Privacy", "Digital Rights"],
      verificationStatus: "VERIFIED",
      reputationScore: 76.0,
      articleCount: 0,
    },
  });

  const j2Token = devToken("journalist2");
  await prisma.session.upsert({
    where: { token: j2Token.hashed },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: journalist2.id,
      token: j2Token.hashed,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const journalist3 = await prisma.user.upsert({
    where: { email: "sarah.okonkwo@example.com" },
    update: {},
    create: {
      email: "sarah.okonkwo@example.com",
      displayName: "Sarah Okonkwo",
      role: "JOURNALIST",
      emailVerified: true,
    },
  });

  await prisma.journalistProfile.upsert({
    where: { userId: journalist3.id },
    update: {},
    create: {
      userId: journalist3.id,
      pseudonym: "S.Okonkwo",
      bio: "Healthcare and pharmaceutical reporter investigating drug pricing, hospital billing, and public health policy.",
      beats: ["Healthcare", "Pharmaceuticals", "Public Health"],
      verificationStatus: "VERIFIED",
      reputationScore: 68.5,
      articleCount: 0,
    },
  });

  // ============================================================
  // Additional Journalists
  // ============================================================
  const journalist4 = await prisma.user.upsert({
    where: { email: "james.wright@example.com" },
    update: {},
    create: {
      email: "james.wright@example.com",
      displayName: "James Wright",
      role: "JOURNALIST",
      emailVerified: true,
    },
  });

  await prisma.journalistProfile.upsert({
    where: { userId: journalist4.id },
    update: {},
    create: {
      userId: journalist4.id,
      pseudonym: "J.Wright",
      bio: "Environmental and energy reporter. Covering climate policy, fossil fuel industry practices, and environmental justice for 15 years.",
      beats: ["Environment", "Energy", "Climate"],
      verificationStatus: "VERIFIED",
      reputationScore: 71.0,
      articleCount: 0,
    },
  });

  const journalist5 = await prisma.user.upsert({
    where: { email: "priya.kapoor@example.com" },
    update: {},
    create: {
      email: "priya.kapoor@example.com",
      displayName: "Priya Kapoor",
      role: "JOURNALIST",
      emailVerified: true,
    },
  });

  await prisma.journalistProfile.upsert({
    where: { userId: journalist5.id },
    update: {},
    create: {
      userId: journalist5.id,
      pseudonym: "P.Kapoor",
      bio: "Defense and national security correspondent. Formerly embedded with coalition forces. Covers defense contracting, intelligence oversight, and military justice.",
      beats: ["Defense", "National Security", "Intelligence"],
      verificationStatus: "VERIFIED",
      reputationScore: 79.0,
      articleCount: 0,
    },
  });

  const journalist6 = await prisma.user.upsert({
    where: { email: "carlos.rivera@example.com" },
    update: {},
    create: {
      email: "carlos.rivera@example.com",
      displayName: "Carlos Rivera",
      role: "JOURNALIST",
      emailVerified: true,
    },
  });

  await prisma.journalistProfile.upsert({
    where: { userId: journalist6.id },
    update: {},
    create: {
      userId: journalist6.id,
      pseudonym: "C.Rivera",
      bio: "Labor and economics reporter covering wage theft, union organizing, and gig economy regulation.",
      beats: ["Labor", "Economics", "Workers Rights"],
      verificationStatus: "VERIFIED",
      reputationScore: 65.0,
      articleCount: 0,
    },
  });

  console.log("  Created 6 verified journalists");

  // ============================================================
  // Reader/Subscriber
  // ============================================================
  const reader = await prisma.user.upsert({
    where: { email: "reader@example.com" },
    update: {},
    create: {
      email: "reader@example.com",
      displayName: "Jane Reader",
      role: "READER",
      emailVerified: true,
    },
  });

  const readerToken = devToken("reader");
  await prisma.session.upsert({
    where: { token: readerToken.hashed },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: reader.id,
      token: readerToken.hashed,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // Give reader a subscription
  await prisma.subscription.upsert({
    where: { userId: reader.id },
    update: {},
    create: {
      userId: reader.id,
      plan: "MONTHLY",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("  Created reader with active subscription: reader@example.com");

  // Unsubscribed reader (for paywall testing)
  const reader2 = await prisma.user.upsert({
    where: { email: "free-reader@example.com" },
    update: {},
    create: {
      email: "free-reader@example.com",
      displayName: "Free Reader",
      role: "READER",
      emailVerified: true,
    },
  });

  const reader2Token = devToken("reader2");
  await prisma.session.upsert({
    where: { token: reader2Token.hashed },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: reader2.id,
      token: reader2Token.hashed,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("  Created unsubscribed reader: free-reader@example.com");

  // ============================================================
  // Articles
  // ============================================================

  // Article 1 - Government investigation (E.Vasquez)
  const article1Content = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "A six-month investigation by Free Press has uncovered that Riverside County allocated $47 million in federal infrastructure funds to projects that were never completed, with at least $12 million flowing to contractors with direct ties to county officials.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "The Money Trail" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Public records obtained through Freedom of Information requests reveal a pattern of no-bid contracts awarded to three firms sharing the same registered agent. These firms — Pacific Road Solutions, Western Infrastructure Partners, and Greenfield Construction Group — received a combined $31.2 million in contracts between 2021 and 2024.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Corporate filings show that David Martinez, Chief of Staff to County Supervisor Helen Park, served as the registered agent for all three companies until January 2021 — just weeks before the first contracts were awarded.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Ghost Projects" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: 'Site visits to 14 of the 23 funded project locations revealed that eight showed no evidence of any construction activity. Satellite imagery from Planet Labs confirms that four sites designated for "road resurfacing" appear unchanged from their pre-contract state.',
          },
        ],
      },
      {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: '"This is one of the most brazen misuses of federal infrastructure dollars we\'ve seen," said Dr. Rebecca Torres, a public finance researcher at Georgetown University. "The lack of oversight is staggering."',
              },
            ],
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Officials Respond" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Supervisor Park's office declined to comment, citing pending litigation. Martinez did not respond to multiple requests for comment sent via email and certified mail over three weeks.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "The county's Inspector General confirmed to Free Press that an investigation was opened in September 2024 but declined to provide further details.",
          },
        ],
      },
    ],
  };

  const article1 = await prisma.article.upsert({
    where: { slug: "riverside-county-47m-infrastructure-funds-investigation" },
    update: {},
    create: {
      authorId: journalist1.id,
      title:
        "$47 Million in Infrastructure Funds Directed to Ghost Projects in Riverside County",
      slug: "riverside-county-47m-infrastructure-funds-investigation",
      summary:
        "A six-month investigation reveals that tens of millions in federal infrastructure dollars were allocated to projects that were never started, with funds flowing to firms tied to county officials.",
      content: article1Content,
      contentText:
        "A six-month investigation by Free Press has uncovered that Riverside County allocated $47 million in federal infrastructure funds to projects that were never completed, with at least $12 million flowing to contractors with direct ties to county officials. Public records obtained through Freedom of Information requests reveal a pattern of no-bid contracts awarded to three firms sharing the same registered agent. Site visits to 14 of the 23 funded project locations revealed that eight showed no evidence of any construction activity.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      version: 1,
      sourceComplete: true,
      claimCount: 0,
    },
  });

  // Sources for article 1
  await prisma.source.createMany({
    data: [
      {
        articleId: article1.id,
        sourceType: "PRIMARY_DOCUMENT",
        quality: "PRIMARY",
        url: "https://example.com/foia-response-riverside",
        title: "FOIA Response: Riverside County Infrastructure Contracts 2021-2024",
        description:
          "Full records of all infrastructure contracts awarded during the period, obtained via Freedom of Information Act request.",
      },
      {
        articleId: article1.id,
        sourceType: "PUBLIC_RECORD",
        quality: "PRIMARY",
        url: "https://example.com/corporate-filings",
        title: "Secretary of State Corporate Filings",
        description:
          "Registered agent records for Pacific Road Solutions, Western Infrastructure Partners, and Greenfield Construction Group.",
      },
      {
        articleId: article1.id,
        sourceType: "DATASET",
        quality: "PRIMARY",
        url: "https://example.com/satellite-imagery",
        title: "Planet Labs Satellite Imagery - Project Sites",
        description:
          "Before/after satellite imagery of 14 project sites showing no construction activity.",
      },
      {
        articleId: article1.id,
        sourceType: "INTERVIEW",
        quality: "SECONDARY",
        title: "Expert Interview: Dr. Rebecca Torres",
        description:
          "On-record interview with Georgetown University public finance researcher.",
      },
      {
        articleId: article1.id,
        sourceType: "OFFICIAL_STATEMENT",
        quality: "SECONDARY",
        title: "Office of the Inspector General - Confirmation",
        description:
          "Verbal confirmation that an investigation was opened in September 2024.",
      },
    ],
    skipDuplicates: true,
  });

  // Version record
  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article1.id, version: 1 } },
    update: {},
    create: {
      articleId: article1.id,
      version: 1,
      title: article1.title,
      content: article1Content,
      summary: article1.summary,
      changedBy: journalist1.id,
      changeNote: "Initial publication",
    },
  });

  // Integrity label - Supported
  await prisma.integrityLabel.create({
    data: {
      articleId: article1.id,
      labelType: "SUPPORTED",
      reason: "Strong primary sourcing with corroborating evidence",
      appliedBy: admin.id,
    },
  });

  // Article 2 - Tech/Privacy investigation (M.Chen)
  const article2Content = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Internal documents from Nexus Analytics, one of the largest data brokers in the United States, reveal that the company has been selling real-time location data from 87 million mobile devices to at least 14 law enforcement agencies — without warrants.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          { type: "text", text: "The Scope of Surveillance" },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: 'The data, sourced from popular weather, navigation, and shopping apps, allows agencies to track individuals\' movements with precision down to three meters. A training document labeled "Law Enforcement Solutions" describes how officers can query the system to see "everywhere a target has been in the last 12 months."',
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Two current Nexus Analytics employees, speaking on condition of anonymity due to non-disclosure agreements, confirmed the program's existence and scale.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [
          { type: "text", text: "Legal Gray Zone" },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: 'Constitutional law experts say the practice exploits a gap in Fourth Amendment protections. "The third-party doctrine has not kept pace with the surveillance capabilities of modern data brokers," said Professor Alan Westin at Yale Law School.',
          },
        ],
      },
    ],
  };

  const article2 = await prisma.article.upsert({
    where: { slug: "nexus-analytics-selling-location-data-law-enforcement" },
    update: {},
    create: {
      authorId: journalist2.id,
      title:
        "Data Broker Nexus Analytics Sold Location Data on 87 Million Devices to Police Without Warrants",
      slug: "nexus-analytics-selling-location-data-law-enforcement",
      summary:
        "Internal documents reveal one of America's largest data brokers has been selling real-time mobile location data to law enforcement agencies without judicial oversight.",
      content: article2Content,
      contentText:
        "Internal documents from Nexus Analytics, one of the largest data brokers in the United States, reveal that the company has been selling real-time location data from 87 million mobile devices to at least 14 law enforcement agencies without warrants. The data allows agencies to track individuals' movements with precision down to three meters.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      version: 1,
      sourceComplete: true,
      claimCount: 0,
    },
  });

  await prisma.source.createMany({
    data: [
      {
        articleId: article2.id,
        sourceType: "PRIMARY_DOCUMENT",
        quality: "PRIMARY",
        title: "Nexus Analytics Internal Documents - Law Enforcement Solutions",
        description:
          "Internal training materials and product documentation for the law enforcement data access program.",
      },
      {
        articleId: article2.id,
        sourceType: "INTERVIEW",
        quality: "ANONYMOUS",
        title: "Nexus Analytics Employees (Anonymous)",
        description:
          "Two current employees confirmed program existence and scale on condition of anonymity.",
        isAnonymous: true,
      },
      {
        articleId: article2.id,
        sourceType: "INTERVIEW",
        quality: "SECONDARY",
        title: "Expert Interview: Prof. Alan Westin, Yale Law School",
        description: "On-record analysis of Fourth Amendment implications.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article2.id, version: 1 } },
    update: {},
    create: {
      articleId: article2.id,
      version: 1,
      title: article2.title,
      content: article2Content,
      summary: article2.summary,
      changedBy: journalist2.id,
      changeNote: "Initial publication",
    },
  });

  // Article 3 - Healthcare (S.Okonkwo) - with dispute
  const article3Content = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "An analysis of Medicare billing data reveals that Meridian Health Systems, which operates 23 hospitals across six states, has been systematically upcoding emergency room visits — billing for more expensive treatments than patients actually received.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Pattern of Overbilling" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Between 2022 and 2024, Meridian billed 73% of its ER visits as \"high severity\" (Level 4 or 5), compared to a national average of 42%. A statistical analysis conducted by health economics firm DataPulse found the deviation is \"highly improbable absent systematic upcoding.\"",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Former billing department employees at two Meridian facilities described internal pressure to classify visits at the highest possible level. One described mandatory training sessions focused on \"revenue optimization\" that effectively taught staff to justify higher billing codes.",
          },
        ],
      },
    ],
  };

  const article3 = await prisma.article.upsert({
    where: { slug: "meridian-health-er-overbilling-investigation" },
    update: {},
    create: {
      authorId: journalist3.id,
      title:
        "Meridian Health Systems: How a Hospital Chain Overbilled Medicare by an Estimated $340 Million",
      slug: "meridian-health-er-overbilling-investigation",
      summary:
        "Medicare billing data and former employee testimony reveal systematic emergency room upcoding across a 23-hospital chain.",
      content: article3Content,
      contentText:
        "An analysis of Medicare billing data reveals that Meridian Health Systems has been systematically upcoding emergency room visits. Between 2022 and 2024, Meridian billed 73% of its ER visits as high severity, compared to a national average of 42%.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      version: 2,
      sourceComplete: false,
      claimCount: 0,
    },
  });

  await prisma.source.createMany({
    data: [
      {
        articleId: article3.id,
        sourceType: "DATASET",
        quality: "PRIMARY",
        url: "https://example.com/cms-billing-data",
        title: "CMS Medicare Billing Data 2022-2024",
        description:
          "Publicly available Medicare claims data analyzed for billing code distribution.",
      },
      {
        articleId: article3.id,
        sourceType: "SECONDARY_REPORT",
        quality: "SECONDARY",
        title: "DataPulse Statistical Analysis",
        description:
          "Independent statistical analysis of Meridian billing patterns vs. national averages.",
      },
      {
        articleId: article3.id,
        sourceType: "INTERVIEW",
        quality: "ANONYMOUS",
        title: "Former Meridian Billing Staff (Anonymous)",
        description:
          "Former employees from two facilities describing internal billing practices.",
        isAnonymous: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article3.id, version: 1 } },
    update: {},
    create: {
      articleId: article3.id,
      version: 1,
      title: article3.title,
      content: article3Content,
      summary: article3.summary,
      changedBy: journalist3.id,
      changeNote: "Initial publication",
    },
  });

  // Add integrity labels
  await prisma.integrityLabel.create({
    data: {
      articleId: article3.id,
      labelType: "DISPUTED",
      reason: "Meridian Health Systems has disputed the billing analysis methodology",
      appliedBy: admin.id,
    },
  });

  await prisma.integrityLabel.create({
    data: {
      articleId: article3.id,
      labelType: "NEEDS_SOURCE",
      reason: "Anonymous sources only - no on-record confirmation from former staff",
      appliedBy: admin.id,
    },
  });

  // Add a correction
  await prisma.correction.create({
    data: {
      articleId: article3.id,
      authorId: journalist3.id,
      content:
        "An earlier version of this article stated the overbilling estimate was $420 million. After review by DataPulse, the corrected figure is $340 million. The statistical methodology was also updated to account for regional billing variations.",
      severity: "FACTUAL_ERROR",
      status: "PUBLISHED",
    },
  });

  // Add a dispute
  await prisma.dispute.create({
    data: {
      articleId: article3.id,
      submitterId: reader.id,
      reason:
        "The article's statistical analysis does not adequately account for differences in patient acuity between Meridian's patient population and national averages. Meridian hospitals are disproportionately located in underserved areas with higher-acuity patients.",
      evidence:
        "CMS Hospital Compare data shows Meridian facilities serve a significantly higher proportion of dual-eligible patients, which correlates with higher acuity ER visits.",
      status: "OPEN",
    },
  });

  // Article 4 - Draft (from journalist 1)
  await prisma.article.upsert({
    where: { slug: "school-district-budget-shortfall-draft" },
    update: {},
    create: {
      authorId: journalist1.id,
      title: "School District Faces $200M Budget Shortfall After Bond Mismanagement",
      slug: "school-district-budget-shortfall-draft",
      summary:
        "Internal auditor reports reveal that the Lakewood Unified School District invested bond proceeds in high-risk instruments that lost 40% of their value.",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Draft in progress..." }] }] },
      contentText: "Draft in progress...",
      status: "DRAFT",
      version: 1,
      sourceComplete: false,
      claimCount: 0,
    },
  });

  // ============================================================
  // Additional Published Articles
  // ============================================================

  // Article 5 - Environment (J.Wright) — includes video embed
  const article5Content = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Satellite imagery, EPA discharge reports, and testimony from three former plant managers reveal that Consolidated Petrochemicals has been releasing untreated wastewater into tributaries of the Sabine River in eastern Texas since at least 2019." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Contamination Levels" }] },
      { type: "paragraph", content: [{ type: "text", text: "Water samples collected at five discharge points downstream of the Beaumont refinery showed benzene concentrations 14 times above EPA safe limits and toluene levels that exceeded federal thresholds by a factor of nine." }] },
      { type: "videoEmbed", attrs: { src: "https://www.youtube.com/embed/dQw4w9WgXcQ", provider: "youtube", videoId: "dQw4w9WgXcQ" } },
      { type: "paragraph", content: [{ type: "text", text: "The video above shows aerial drone footage of discolored discharge visible at the primary outflow pipe, filmed during a November 2025 site visit. The plume extends approximately 200 meters downstream before dispersing." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Regulatory Failure" }] },
      { type: "paragraph", content: [{ type: "text", text: "Texas Commission on Environmental Quality records show the facility passed its last three inspections despite the ongoing violations. Two former TCEQ inspectors, speaking off the record, described a culture of \"inspect and move on\" driven by chronic understaffing." }] },
      { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "\"The state is essentially running an honor system for industrial polluters,\" said Dr. Maria Santos, an environmental toxicologist at Rice University." }] }] },
    ],
  };

  const article5 = await prisma.article.upsert({
    where: { slug: "consolidated-petrochemicals-sabine-river-contamination" },
    update: {},
    create: {
      authorId: journalist4.id,
      title: "Consolidated Petrochemicals Dumped Untreated Waste into the Sabine River for Six Years",
      slug: "consolidated-petrochemicals-sabine-river-contamination",
      summary: "Satellite imagery and water testing reveal years of illegal wastewater discharge from a Texas refinery, with regulators failing to act despite clear evidence.",
      content: article5Content,
      contentText: "Satellite imagery, EPA discharge reports, and testimony from three former plant managers reveal that Consolidated Petrochemicals has been releasing untreated wastewater into tributaries of the Sabine River in eastern Texas since at least 2019. Water samples showed benzene concentrations 14 times above EPA safe limits.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      version: 1,
      sourceComplete: true,
      claimCount: 0,
    },
  });

  await prisma.source.createMany({
    data: [
      { articleId: article5.id, sourceType: "DATASET", quality: "PRIMARY", title: "EPA Discharge Monitoring Reports 2019-2025", description: "Facility self-reported discharge data filed with the EPA." },
      { articleId: article5.id, sourceType: "DATASET", quality: "PRIMARY", title: "Independent Water Sample Analysis — Sabine River", description: "Laboratory analysis of water samples from five downstream collection points.", url: "https://example.com/water-analysis" },
      { articleId: article5.id, sourceType: "MULTIMEDIA", quality: "PRIMARY", title: "Drone Footage — Beaumont Refinery Discharge", description: "Aerial footage captured during November 2025 site visit." },
      { articleId: article5.id, sourceType: "INTERVIEW", quality: "ANONYMOUS", title: "Former Consolidated Plant Managers (3)", description: "Off-record testimony describing discharge practices.", isAnonymous: true },
      { articleId: article5.id, sourceType: "INTERVIEW", quality: "SECONDARY", title: "Dr. Maria Santos, Rice University", description: "On-record expert commentary on regulatory enforcement gaps." },
    ],
    skipDuplicates: true,
  });

  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article5.id, version: 1 } },
    update: {},
    create: { articleId: article5.id, version: 1, title: article5.title, content: article5Content, summary: article5.summary, changedBy: journalist4.id, changeNote: "Initial publication" },
  });

  await prisma.integrityLabel.create({ data: { articleId: article5.id, labelType: "SUPPORTED", reason: "Primary source data with independent lab verification", appliedBy: admin.id } });

  // Article 6 - Defense (P.Kapoor)
  const article6Content = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "A review of Pentagon procurement records and internal audit documents reveals that Sentinel Defense Group billed the Department of Defense $1.2 billion for body armor systems that failed ballistic testing — and the DOD continued purchasing them for three years after learning of the failures." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Testing Failures" }] },
      { type: "paragraph", content: [{ type: "text", text: "The Advanced Combat Protection System (ACPS), marketed as capable of stopping 7.62mm rounds, failed in 23 of 40 independent ballistic tests conducted by the Army Research Laboratory between 2021 and 2023. Despite this, the DOD exercised three additional contract options worth a combined $430 million." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "The Lobbying Connection" }] },
      { type: "paragraph", content: [{ type: "text", text: "Federal lobbying disclosures show that Sentinel spent $4.7 million on lobbying between 2020 and 2024. Three of the firm's registered lobbyists are former senior DOD acquisition officials who oversaw body armor procurement during their government tenure." }] },
    ],
  };

  const article6 = await prisma.article.upsert({
    where: { slug: "sentinel-defense-body-armor-failures" },
    update: {},
    create: {
      authorId: journalist5.id,
      title: "Pentagon Spent $1.2 Billion on Body Armor That Failed Ballistic Tests",
      slug: "sentinel-defense-body-armor-failures",
      summary: "Procurement records show the DOD continued buying from Sentinel Defense Group for three years after internal testing revealed critical protection failures.",
      content: article6Content,
      contentText: "A review of Pentagon procurement records reveals that Sentinel Defense Group billed the DOD $1.2 billion for body armor that failed ballistic testing. The Advanced Combat Protection System failed in 23 of 40 independent tests.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      version: 1,
      sourceComplete: true,
      claimCount: 0,
    },
  });

  await prisma.source.createMany({
    data: [
      { articleId: article6.id, sourceType: "PRIMARY_DOCUMENT", quality: "PRIMARY", title: "DOD Procurement Contract Records — ACPS Program", description: "Federal procurement database records for all ACPS contract awards and modifications." },
      { articleId: article6.id, sourceType: "PRIMARY_DOCUMENT", quality: "PRIMARY", title: "Army Research Laboratory Ballistic Test Reports", description: "Official test results showing failure rates in 7.62mm protection standard." },
      { articleId: article6.id, sourceType: "PUBLIC_RECORD", quality: "PRIMARY", title: "Federal Lobbying Disclosure Records", description: "Sentinel Defense Group lobbying expenditures and registered lobbyist employment histories.", url: "https://example.com/lobbying-disclosures" },
    ],
    skipDuplicates: true,
  });

  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article6.id, version: 1 } },
    update: {},
    create: { articleId: article6.id, version: 1, title: article6.title, content: article6Content, summary: article6.summary, changedBy: journalist5.id, changeNote: "Initial publication" },
  });

  await prisma.integrityLabel.create({ data: { articleId: article6.id, labelType: "SUPPORTED", reason: "Entirely primary-source based with verifiable public records", appliedBy: admin.id } });

  // Article 7 - Labor (C.Rivera) — includes image placeholder
  const article7Content = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "An 18-month investigation into Amazon warehouse operations across seven states reveals systematic wage theft through a combination of unpaid mandatory security screenings, forced clock-outs during active shifts, and algorithmic productivity penalties that effectively reduce hourly pay below minimum wage for an estimated 340,000 workers." }] },
      { type: "image", attrs: { src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800", alt: "Warehouse interior with conveyor belt systems" } },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "The Security Screen Gap" }] },
      { type: "paragraph", content: [{ type: "text", text: "Workers at 14 facilities described mandatory security screenings lasting 15-25 minutes at the end of each shift. Despite a 2014 Supreme Court ruling (Integrity Staffing Solutions v. Busk) that employers need not compensate for such time, Amazon's own internal policies acknowledge the screenings are for \"company property protection\" — a distinction that labor attorneys say reopens the legal question." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Algorithmic Wage Theft" }] },
      { type: "paragraph", content: [{ type: "text", text: "Perhaps more significant is the practice workers call \"rate chasing.\" Amazon's proprietary productivity algorithm, known internally as ADAPT, sets individual rate targets that escalate weekly. Workers who fall below target receive automated warnings and, after three warnings in a rolling 30-day period, automatic termination." }] },
      { type: "paragraph", content: [{ type: "text", text: "Payroll records obtained from two facilities show that the effective hourly wage — after accounting for unpaid security time, forced break extensions, and productivity-related pay deductions — drops to $11.40 per hour in some cases, well below the $15 minimum wage in the states examined." }] },
    ],
  };

  const article7 = await prisma.article.upsert({
    where: { slug: "amazon-warehouse-wage-theft-investigation" },
    update: {},
    create: {
      authorId: journalist6.id,
      title: "Inside Amazon's Wage Machine: How 340,000 Workers Are Paid Below Minimum Wage",
      slug: "amazon-warehouse-wage-theft-investigation",
      summary: "An 18-month investigation reveals systematic wage theft at Amazon warehouses through unpaid security screenings, forced clock-outs, and algorithmic productivity penalties.",
      content: article7Content,
      contentText: "An 18-month investigation into Amazon warehouse operations reveals systematic wage theft affecting 340,000 workers through unpaid security screenings, forced clock-outs, and algorithmic productivity penalties that reduce effective hourly pay below minimum wage.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      version: 1,
      sourceComplete: true,
      claimCount: 0,
    },
  });

  await prisma.source.createMany({
    data: [
      { articleId: article7.id, sourceType: "PRIMARY_DOCUMENT", quality: "PRIMARY", title: "Amazon Internal ADAPT Algorithm Documentation", description: "Leaked internal technical documentation for the productivity tracking system." },
      { articleId: article7.id, sourceType: "DATASET", quality: "PRIMARY", title: "Payroll Records — Two Amazon Fulfillment Centers", description: "Anonymized payroll data showing effective hourly rates after deductions.", url: "https://example.com/payroll-analysis" },
      { articleId: article7.id, sourceType: "INTERVIEW", quality: "ANONYMOUS", title: "Current and Former Amazon Workers (47 interviews)", description: "Interviews conducted across seven states describing working conditions.", isAnonymous: true },
      { articleId: article7.id, sourceType: "PUBLIC_RECORD", quality: "PRIMARY", title: "State DOL Wage Complaints 2022-2025", description: "Department of Labor complaint filings against Amazon fulfillment centers." },
    ],
    skipDuplicates: true,
  });

  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article7.id, version: 1 } },
    update: {},
    create: { articleId: article7.id, version: 1, title: article7.title, content: article7Content, summary: article7.summary, changedBy: journalist6.id, changeNote: "Initial publication" },
  });

  // Article 8 - Tech/AI (M.Chen) — includes video embed
  const article8Content = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Internal testing documents from ClearView AI reveal that the company's facial recognition system, used by over 600 law enforcement agencies, misidentifies Black and Latino individuals at rates 10 to 100 times higher than white individuals — a disparity the company has known about since 2022 but never disclosed to its government clients." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "The Accuracy Gap" }] },
      { type: "paragraph", content: [{ type: "text", text: "According to internal benchmark reports, ClearView's system achieves a 99.7% true positive rate for white male subjects but drops to 83.2% for Black women and 87.1% for Latino men. These numbers, labeled \"CONFIDENTIAL — NOT FOR CLIENT DISTRIBUTION,\" were never included in the marketing materials or accuracy claims presented to police departments." }] },
      { type: "videoEmbed", attrs: { src: "https://www.youtube.com/embed/dQw4w9WgXcQ", provider: "youtube", videoId: "dQw4w9WgXcQ" } },
      { type: "paragraph", content: [{ type: "text", text: "The demonstration video above shows how identical test images produce dramatically different confidence scores depending on the subject's demographic characteristics." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Real-World Consequences" }] },
      { type: "paragraph", content: [{ type: "text", text: "At least 14 documented cases of wrongful arrest linked to facial recognition misidentification have been identified across six jurisdictions that use ClearView. In each case, the arrested individual was Black or Latino." }] },
    ],
  };

  const article8 = await prisma.article.upsert({
    where: { slug: "clearview-ai-racial-bias-facial-recognition" },
    update: {},
    create: {
      authorId: journalist2.id,
      title: "ClearView AI Knew Its Facial Recognition Was Biased — and Sold It to 600 Police Departments Anyway",
      slug: "clearview-ai-racial-bias-facial-recognition",
      summary: "Internal testing documents show the facial recognition system misidentifies Black and Latino individuals at rates up to 100x higher, a fact concealed from law enforcement clients.",
      content: article8Content,
      contentText: "Internal testing documents from ClearView AI reveal that the company's facial recognition system misidentifies Black and Latino individuals at rates 10 to 100 times higher than white individuals. The company has known since 2022 but never disclosed this to government clients.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      version: 1,
      sourceComplete: true,
      claimCount: 0,
    },
  });

  await prisma.source.createMany({
    data: [
      { articleId: article8.id, sourceType: "PRIMARY_DOCUMENT", quality: "PRIMARY", title: "ClearView AI Internal Benchmark Reports 2022-2025", description: "Confidential accuracy testing results broken down by demographic category." },
      { articleId: article8.id, sourceType: "DATASET", quality: "PRIMARY", title: "NIST Face Recognition Vendor Test (FRVT) Data", description: "Independent federal benchmark data for comparison.", url: "https://example.com/nist-frvt" },
      { articleId: article8.id, sourceType: "PUBLIC_RECORD", quality: "PRIMARY", title: "Wrongful Arrest Court Records (14 cases)", description: "Court filings from six jurisdictions documenting facial recognition misidentification." },
      { articleId: article8.id, sourceType: "INTERVIEW", quality: "ANONYMOUS", title: "Former ClearView AI Engineers (2)", description: "Former employees describing internal awareness of bias issues.", isAnonymous: true },
    ],
    skipDuplicates: true,
  });

  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article8.id, version: 1 } },
    update: {},
    create: { articleId: article8.id, version: 1, title: article8.title, content: article8Content, summary: article8.summary, changedBy: journalist2.id, changeNote: "Initial publication" },
  });

  // Article 9 - Environment (J.Wright) — held for review
  await prisma.article.upsert({
    where: { slug: "pfas-drinking-water-cover-up-draft" },
    update: {},
    create: {
      authorId: journalist4.id,
      title: "State Environmental Agency Suppressed PFAS Test Results for 47 Municipal Water Systems",
      slug: "pfas-drinking-water-cover-up-draft",
      summary: "Documents show the agency had test results showing dangerous PFAS levels months before public disclosure, during which time residents continued drinking contaminated water.",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Investigation in progress. Awaiting final source confirmation." }] }] },
      contentText: "Investigation in progress. Awaiting final source confirmation.",
      status: "HELD",
      version: 1,
      sourceComplete: false,
      claimCount: 0,
    },
  });

  // Article 10 - Healthcare (S.Okonkwo) — with image
  const article10Content = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "A nationwide analysis of pharmaceutical pricing data reveals that insulin manufacturers have been coordinating price increases through a network of pharmacy benefit managers, resulting in average out-of-pocket costs that are 8x higher in the US than in comparable countries." }] },
      { type: "image", attrs: { src: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800", alt: "Insulin vials and syringes on a medical tray" } },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "The PBM Pipeline" }] },
      { type: "paragraph", content: [{ type: "text", text: "Three PBMs — Express Scripts, CVS Caremark, and OptumRx — control 80% of the US prescription drug market. Internal communications obtained through litigation discovery show executives at all three companies discussing insulin pricing with manufacturer representatives in meetings that were deliberately excluded from compliance monitoring." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Patient Impact" }] },
      { type: "paragraph", content: [{ type: "text", text: "The American Diabetes Association estimates that 1.3 million Americans ration insulin due to cost. Emergency room data from 340 hospitals shows a 40% increase in diabetic ketoacidosis admissions — a life-threatening condition caused by insufficient insulin — since 2018." }] },
    ],
  };

  const article10 = await prisma.article.upsert({
    where: { slug: "insulin-pricing-pbm-coordination-investigation" },
    update: {},
    create: {
      authorId: journalist3.id,
      title: "The Insulin Cartel: How Three Companies Keep Prices 8x Higher Than the Rest of the World",
      slug: "insulin-pricing-pbm-coordination-investigation",
      summary: "Pricing data and internal communications reveal coordinated insulin price manipulation through pharmacy benefit managers, costing American patients billions.",
      content: article10Content,
      contentText: "A nationwide analysis reveals insulin manufacturers have been coordinating price increases through PBMs, resulting in costs 8x higher than comparable countries. 1.3 million Americans ration insulin due to cost.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      version: 1,
      sourceComplete: true,
      claimCount: 0,
    },
  });

  await prisma.source.createMany({
    data: [
      { articleId: article10.id, sourceType: "PRIMARY_DOCUMENT", quality: "PRIMARY", title: "PBM Internal Communications (Litigation Discovery)", description: "Emails and meeting notes obtained through ongoing antitrust litigation." },
      { articleId: article10.id, sourceType: "DATASET", quality: "PRIMARY", title: "CMS Drug Pricing Transparency Data 2018-2025", description: "Federal pricing data showing insulin cost trends.", url: "https://example.com/cms-drug-pricing" },
      { articleId: article10.id, sourceType: "DATASET", quality: "PRIMARY", title: "ADA Emergency Room Admission Analysis", description: "Diabetic ketoacidosis admission data from 340 hospitals." },
    ],
    skipDuplicates: true,
  });

  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article10.id, version: 1 } },
    update: {},
    create: { articleId: article10.id, version: 1, title: article10.title, content: article10Content, summary: article10.summary, changedBy: journalist3.id, changeNote: "Initial publication" },
  });

  // Article 11 - Defense (P.Kapoor)
  const article11Content = {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "An investigation into military housing privatization reveals that families living on 12 Army installations have been exposed to toxic mold, lead paint, and structural failures while private contractors collected $3.8 billion in guaranteed government payments." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Guaranteed Profits, Ignored Maintenance" }] },
      { type: "paragraph", content: [{ type: "text", text: "Under 50-year privatization contracts signed in the early 2000s, companies like Balfour Beatty and Lendlease receive automatic monthly payments from the military regardless of housing quality. Internal maintenance logs obtained through FOIA show that work orders for critical health and safety issues averaged 147 days to resolve — with some mold remediation requests pending for over a year." }] },
      { type: "paragraph", content: [{ type: "text", text: "Medical records from Fort Hood, Fort Bragg, and Joint Base Lewis-McChord document 2,300 cases of respiratory illness in military children living in privatized housing, a rate three times higher than the national average for comparable age groups." }] },
    ],
  };

  const article11 = await prisma.article.upsert({
    where: { slug: "military-housing-privatization-health-crisis" },
    update: {},
    create: {
      authorId: journalist5.id,
      title: "$3.8 Billion in Guaranteed Payments While Military Families Live in Toxic Housing",
      slug: "military-housing-privatization-health-crisis",
      summary: "FOIA documents and medical records reveal dangerous conditions in privatized military housing while contractors collect billions in guaranteed payments.",
      content: article11Content,
      contentText: "Families on 12 Army installations have been exposed to toxic mold, lead paint, and structural failures while private contractors collected $3.8 billion in guaranteed government payments. Medical records document 2,300 cases of respiratory illness in military children.",
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      version: 1,
      sourceComplete: true,
      claimCount: 0,
    },
  });

  await prisma.source.createMany({
    data: [
      { articleId: article11.id, sourceType: "PRIMARY_DOCUMENT", quality: "PRIMARY", title: "FOIA: Military Housing Maintenance Logs 2020-2025", description: "Work order records from 12 installations." },
      { articleId: article11.id, sourceType: "PRIMARY_DOCUMENT", quality: "PRIMARY", title: "DOD Inspector General Housing Audit Reports", description: "Annual audit findings for privatized housing contractors." },
      { articleId: article11.id, sourceType: "DATASET", quality: "PRIMARY", title: "Military Treatment Facility Medical Records (Anonymized)", description: "Aggregated respiratory illness rates for children in privatized vs. non-privatized housing." },
    ],
    skipDuplicates: true,
  });

  await prisma.articleVersion.upsert({
    where: { articleId_version: { articleId: article11.id, version: 1 } },
    update: {},
    create: { articleId: article11.id, version: 1, title: article11.title, content: article11Content, summary: article11.summary, changedBy: journalist5.id, changeNote: "Initial publication" },
  });

  // ============================================================
  // Read tracking events (for revenue testing)
  // ============================================================
  const readArticles = [article1, article2, article5, article6, article7, article8, article10, article11];
  for (const article of readArticles) {
    // Simulate 5-15 reads per article
    const readCount = 5 + Math.floor(Math.random() * 11);
    for (let i = 0; i < readCount; i++) {
      await prisma.auditLog.create({
        data: {
          userId: i % 2 === 0 ? reader.id : null,
          action: "article_read",
          entity: "Article",
          entityId: article.id,
          details: {
            dedupeKey: `seed-read-${article.id}-${i}`,
            day: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            actorType: i % 2 === 0 ? "user" : "anonymous",
          },
        },
      });
    }
  }

  // Update article counts
  await prisma.journalistProfile.update({
    where: { userId: journalist1.id },
    data: { articleCount: 1 },
  });
  await prisma.journalistProfile.update({
    where: { userId: journalist2.id },
    data: { articleCount: 2 },
  });
  await prisma.journalistProfile.update({
    where: { userId: journalist3.id },
    data: { articleCount: 2 },
  });
  await prisma.journalistProfile.update({
    where: { userId: journalist4.id },
    data: { articleCount: 1 },
  });
  await prisma.journalistProfile.update({
    where: { userId: journalist5.id },
    data: { articleCount: 2 },
  });
  await prisma.journalistProfile.update({
    where: { userId: journalist6.id },
    data: { articleCount: 1 },
  });

  // ============================================================
  // Flags
  // ============================================================
  await prisma.flag.create({
    data: {
      articleId: article3.id,
      reporterId: reader.id,
      reason: "INACCURATE",
      details:
        "The overbilling estimate methodology does not account for patient population differences. See CMS Hospital Compare for evidence.",
      status: "PENDING",
    },
  });

  // ============================================================
  // Bookmarks
  // ============================================================
  await prisma.bookmark.create({
    data: {
      userId: reader.id,
      articleId: article1.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: reader.id,
      articleId: article2.id,
    },
  });

  // ============================================================
  // Feature Requests
  // ============================================================
  const fr1 = await prisma.featureRequest.create({
    data: {
      userId: reader.id,
      title: "Dark mode support",
      description:
        "Add a dark mode toggle for better reading in low-light environments. Many news platforms now support this and it's been shown to reduce eye strain during extended reading sessions.",
      status: "PLANNED",
      decisionLog: "Planned for next release. Will use system preference detection with manual override.",
    },
  });

  const fr2 = await prisma.featureRequest.create({
    data: {
      userId: journalist1.id,
      title: "Collaborative article editing",
      description:
        "Allow multiple verified journalists to co-author articles. This would be especially valuable for large investigations that span multiple beats or geographic areas.",
      status: "OPEN",
    },
  });

  const fr3 = await prisma.featureRequest.create({
    data: {
      userId: journalist2.id,
      title: "RSS feed for published articles",
      description:
        "Provide an RSS feed so readers can follow articles in their preferred news reader. This is standard for journalism platforms.",
      status: "OPEN",
    },
  });

  // Votes on feature requests
  await prisma.vote.createMany({
    data: [
      { userId: reader.id, featureRequestId: fr1.id },
      { userId: journalist1.id, featureRequestId: fr1.id },
      { userId: journalist2.id, featureRequestId: fr1.id },
      { userId: journalist3.id, featureRequestId: fr1.id },
      { userId: reader.id, featureRequestId: fr2.id },
      { userId: journalist2.id, featureRequestId: fr2.id },
      { userId: reader.id, featureRequestId: fr3.id },
    ],
  });

  // ============================================================
  // Reputation Events
  // ============================================================
  await prisma.reputationEvent.createMany({
    data: [
      {
        userId: journalist1.id,
        type: "ARTICLE_PUBLISHED",
        delta: 2.0,
        reason: "Published: Riverside County investigation",
        articleId: article1.id,
      },
      {
        userId: journalist1.id,
        type: "SOURCE_COMPLETE",
        delta: 1.0,
        reason: "Complete sourcing on Riverside County investigation",
        articleId: article1.id,
      },
      {
        userId: journalist2.id,
        type: "ARTICLE_PUBLISHED",
        delta: 2.0,
        reason: "Published: Nexus Analytics investigation",
        articleId: article2.id,
      },
      {
        userId: journalist3.id,
        type: "ARTICLE_PUBLISHED",
        delta: 2.0,
        reason: "Published: Meridian Health investigation",
        articleId: article3.id,
      },
      {
        userId: journalist3.id,
        type: "CORRECTION_ISSUED_MAJOR",
        delta: -3.0,
        reason: "Major correction on overbilling estimate",
        articleId: article3.id,
      },
    ],
  });

  // ============================================================
  // Audit Log entries
  // ============================================================
  await prisma.auditLog.createMany({
    data: [
      {
        userId: journalist1.id,
        action: "article_published",
        entity: "Article",
        entityId: article1.id,
      },
      {
        userId: journalist2.id,
        action: "article_published",
        entity: "Article",
        entityId: article2.id,
      },
      {
        userId: journalist3.id,
        action: "article_published",
        entity: "Article",
        entityId: article3.id,
      },
      {
        userId: journalist3.id,
        action: "correction_issued",
        entity: "Article",
        entityId: article3.id,
        details: { severity: "FACTUAL_ERROR" },
      },
      {
        userId: admin.id,
        action: "label_applied",
        entity: "Article",
        entityId: article3.id,
        details: { labelType: "DISPUTED" },
      },
    ],
  });

  console.log("  Created 11 articles (8 published, 1 draft, 1 held, 1 draft)");
  console.log("  Created flags, disputes, corrections, bookmarks");
  console.log("  Created 3 feature requests with votes");
  console.log("  Created read tracking events for revenue testing");
  console.log("");
  console.log("=== Seed Complete ===");
  console.log("");
  console.log("Dev session tokens (set as cookie 'fp_session'):");
  console.log(`  Admin:       ${adminToken.raw}`);
  console.log(`  Journalist1: ${j1Token.raw}`);
  console.log(`  Journalist2: ${j2Token.raw}`);
  console.log(`  Reader:      ${readerToken.raw}`);
  console.log(`  Reader2:     ${reader2Token.raw} (unsubscribed)`);
  console.log("");
  console.log("These are 64-char hex strings that pass middleware validation.");
  console.log("Use: document.cookie = 'fp_session=<token>; path=/'");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
