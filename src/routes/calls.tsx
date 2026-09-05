import { createFileRoute } from "@tanstack/react-router";
import { Mic, MicOff, PhoneOff, ScreenShare, Video, VideoOff } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { VideoFrame } from "@/components/kurukoo/cards";
import { IntegrationGap } from "@/components/kurukoo/primitives";
import { Avatar, Badge, Panel, SectionHeader } from "@/components/kurukoo/ui";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "Voice and calls — Kurukoo" },
      {
        name: "description",
        content: "Voice sessions and call states for talking to Kurukoo, providers and businesses.",
      },
      { property: "og:title", content: "Voice and calls — Kurukoo" },
      {
        property: "og:description",
        content: "The voice modality of the same Kurukoo conversation.",
      },
    ],
  }),
  component: CallsPage,
});

const states = [
  { label: "Incoming", note: "North Lane Plumbing is calling" },
  { label: "Outgoing", note: "Calling Harper Dental…" },
  { label: "Connecting", note: "Establishing a secure session" },
  { label: "Connected", note: "00:42" },
  { label: "Reconnecting", note: "Connection dropped, retrying" },
  { label: "Ended", note: "Call ended · 3:18" },
];

function CallsPage() {
  return (
    <>
      <PageHeader
        title="Voice and calls"
        subtitle="Speaking is another way into the same conversation."
      />

      <Panel className="p-4">
        <div className="flex items-center gap-3">
          <Avatar name="Kurukoo" size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-[15.5px] font-medium">Voice session with Kurukoo</p>
            <p className="text-[13.5px] text-muted-foreground">
              Speak your request, review the transcript, then send.
            </p>
          </div>
          <Badge tone="accent">Preview</Badge>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-elevated/60 p-3 text-[14.5px]">
          <p className="text-[12px] uppercase tracking-wide text-muted-foreground">Transcript</p>
          <p className="mt-1">“Find me a plumber for a leaking kitchen tap this week.”</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Retry", "Cancel", "Send transcript"].map((a) => (
            <span
              key={a}
              className="min-h-9 rounded-lg border border-border px-3 py-1.5 text-[13.5px]"
            >
              {a}
            </span>
          ))}
        </div>
      </Panel>

      <section className="mt-8">
        <SectionHeader
          title="Call states"
          subtitle="UI contracts ready for a real WebRTC session."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {states.map((s) => (
            <Panel key={s.label} className="p-4">
              <p className="text-[15px] font-medium">{s.label}</p>
              <p className="mt-0.5 text-[13.5px] text-muted-foreground">{s.note}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader title="In-call layout" subtitle="Participants, video and controls." />
        <Panel className="p-4">
          <VideoFrame label="Participant video" large />
          <ul className="mt-3 flex flex-wrap gap-3 text-[13.5px] text-muted-foreground">
            <li>You</li>
            <li>North Lane Plumbing</li>
            <li>Kurukoo (listening)</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Call controls">
            {[Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff].map((Icon, i) => (
              <span
                key={i}
                className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground"
              >
                <Icon className="size-[18px]" />
              </span>
            ))}
          </div>
        </Panel>
      </section>

      <IntegrationGap>
        No WebRTC session is established. These are the visual contracts real calls will plug into.
      </IntegrationGap>
    </>
  );
}
