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

  // Create session for admin (token: admin-dev-token)
  const adminSessionToken = hashToken("admin-dev-token");
  await prisma.session.upsert({
    where: { token: adminSessionToken },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: admin.id,
      token: adminSessionToken,
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
  const j1SessionToken = hashToken("journalist1-dev-token");
  await prisma.session.upsert({
    where: { token: j1SessionToken },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: journalist1.id,
      token: j1SessionToken,
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

  const j2SessionToken = hashToken("journalist2-dev-token");
  await prisma.session.upsert({
    where: { token: j2SessionToken },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: journalist2.id,
      token: j2SessionToken,
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

  console.log("  Created 3 verified journalists");

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

  const readerSessionToken = hashToken("reader-dev-token");
  await prisma.session.upsert({
    where: { token: readerSessionToken },
    update: { expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    create: {
      userId: reader.id,
      token: readerSessionToken,
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

  // Update article counts
  await prisma.journalistProfile.update({
    where: { userId: journalist1.id },
    data: { articleCount: 1 },
  });
  await prisma.journalistProfile.update({
    where: { userId: journalist2.id },
    data: { articleCount: 1 },
  });
  await prisma.journalistProfile.update({
    where: { userId: journalist3.id },
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

  console.log("  Created 4 articles (3 published, 1 draft)");
  console.log("  Created flags, disputes, corrections, bookmarks");
  console.log("  Created 3 feature requests with votes");
  console.log("");
  console.log("=== Seed Complete ===");
  console.log("");
  console.log("Dev session tokens (set as cookie 'fp_session'):  ");
  console.log("  Admin:       admin-dev-token");
  console.log("  Journalist1: journalist1-dev-token");
  console.log("  Journalist2: journalist2-dev-token");
  console.log("  Reader:      reader-dev-token");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
