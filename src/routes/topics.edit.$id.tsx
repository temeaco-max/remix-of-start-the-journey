import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel } from "@/components/kurukoo/ui";
import { TopicEditor } from "@/components/kurukoo/topic-editor";
import { fetchMyTopic, topicApiConfigured, updateTopic, type OwnerTopic, type TopicInput } from "@/lib/topic-lifecycle";

export const Route = createFileRoute("/topics/edit/$id")({ head: () => ({ meta: [{ title: "Edit Topic — Kurukoo" }, { name: "description", content: "Edit an eligible Topic and send the changes back through moderation." }] }), component: EditTopicPage });

function EditTopicPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<OwnerTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topicApiConfigured()) { setError("Topic editing requires the canonical Kurukoo backend connection."); setLoading(false); return; }
    void fetchMyTopic(id).then(setTopic).catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Unable to load this Topic.")).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-96 animate-pulse rounded-[24px] border border-border bg-surface" />;
  if (error) return <div className="w-full max-w-3xl"><Link to="/topics/mine" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"><ArrowLeft className="size-3.5" /> Your Topics</Link><Panel className="mt-6 p-6"><p className="text-[13px]">{error}</p>{error.includes("Authentication") ? <Link to="/login" className="mt-3 inline-flex text-[12px] font-medium underline">Sign in to continue</Link> : null}</Panel></div>;
  if (!topic) return null;

  const status = topic.status.toLowerCase();
  const editable = ["draft", "submitted", "restricted"].includes(status);
  if (!editable) return <div className="w-full max-w-3xl"><Link to="/topics/mine" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground"><ArrowLeft className="size-3.5" /> Your Topics</Link><Panel className="mt-6 p-6"><h1 className="text-[18px] font-semibold">This Topic cannot be edited</h1><p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Published Topics are kept as public context. To correct a published Topic, create a new Topic rather than changing the existing public record.</p><Link to="/topics/$slug" params={{ slug: topic.slug }} className="mt-4 inline-flex text-[12.5px] font-medium underline">View Topic</Link></Panel></div>;

  const topicId = topic.id;
  async function save(input: TopicInput) { return updateTopic(topicId, input); }
  return <div className="w-full max-w-3xl"><Link to="/topics/mine" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Your Topics</Link><section className="mt-5 max-w-2xl"><p className="text-[12px] font-medium text-muted-foreground">Edit Topic</p><h1 className="mt-2 font-serif text-[42px] leading-[1.02] tracking-[-0.045em] md:text-[54px]">Keep the public context useful.</h1><p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{status === "draft" ? "Continue your draft when you are ready." : "Changes to this Topic will send it back through moderation before it can be public again."}</p></section>{status === "restricted" && topic.moderationNote ? <Panel className="mt-6 p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-[12.5px] font-medium">Moderation note</p><p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{topic.moderationNote}</p></div></div></Panel> : null}<TopicEditor mode="edit" initialTopic={topic} saveDraft={async (input) => save(input)} submit={async (input) => save(input)} onSaved={async () => { await navigate({ to: "/topics/mine" }); }} onCancel={() => void navigate({ to: "/topics/mine" })} /></div>;
}
