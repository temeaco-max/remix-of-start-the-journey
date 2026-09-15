// Verification: canonical article registry wiring for the imported blog content.
import { articleBySlug, articles } from "../src/lib/kurukoo-demo";
const a = articleBySlug("welcome-to-kurukoo");
const result = {
  articleCount: articles.length,
  resolved: Boolean(a),
  slug: a?.slug ?? null,
  title: a?.title ?? null,
  date: a?.date ?? null,
  paragraphs: a?.body.length ?? 0,
  hasExcerpt: Boolean(a?.excerpt),
  featuredStillFirst: articles[0].slug,
  existingArticlesIntact: ["what-kurukoo-is-for", "designing-for-handover"].every((s) => articles.some((x) => x.slug === s)),
  bodyMentionsMission: (a?.body.join(" ") ?? "").includes("helps people get things done"),
};
console.log(JSON.stringify(result, null, 2));
if (!result.resolved || !result.hasExcerpt || result.paragraphs < 5 || !result.existingArticlesIntact || result.featuredStillFirst !== "what-kurukoo-is-for") {
  console.error("VERIFICATION FAILED");
  process.exit(1);
}
console.log("BLOG CONTENT WIRING VERIFIED");