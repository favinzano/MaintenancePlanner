import { useState, type ButtonHTMLAttributes, type PropsWithChildren, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  AudioLines,
  BookOpenText,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clipboard,
  ClipboardCheck,
  Clock3,
  Copy,
  FileCheck2,
  FileText,
  FolderTree,
  Headphones,
  Info,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

const macroCapLogo = "https://ops.macrocaplabs.com/macrocap-labs-logo-auth-384-v2.avif";

const sections: Array<{ name: string; icon: LucideIcon }> = [
  { name: "Overview", icon: Activity },
  { name: "Evidence", icon: BookOpenText },
  { name: "Asset structure", icon: FolderTree },
  { name: "PM editor", icon: ListChecks },
  { name: "Conversation", icon: MessageSquareText },
];

const initialSteps = [
  "Review the equipment exterior for visible damage.",
  "Confirm the nameplate is present and legible.",
  "Record observations for planner review.",
];

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

function ActionButton({ variant = "secondary", size = "md", className = "", ...props }: ButtonProps) {
  const variants = {
    primary: "border-transparent bg-accent text-accent-foreground hover:bg-accent/90",
    secondary: "border-border-input bg-panel-raised text-foreground hover:bg-panel-raised/80",
    ghost: "border-transparent bg-transparent text-muted hover:bg-panel-raised hover:text-foreground",
    danger: "border-transparent bg-danger text-danger-foreground hover:bg-danger/90",
  };
  const sizes = {
    sm: "min-h-8 gap-1.5 px-2.5 text-xs",
    md: "min-h-10 gap-2 px-3.5 text-sm",
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-control border font-medium transition-colors disabled:cursor-not-allowed disabled:border-border disabled:bg-panel-muted disabled:text-muted ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

function Badge({ tone = "neutral", children }: PropsWithChildren<{ tone?: "neutral" | "success" | "warning" | "danger" | "blue" }>) {
  const tones = {
    neutral: "border-border-input bg-panel-raised text-muted",
    success: "border-success/40 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/10 text-warning",
    danger: "border-danger/40 bg-danger/10 text-danger",
    blue: "border-ring/40 bg-ring/10 text-ring",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function GalleryCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <section className={`rounded-panel border border-border bg-panel p-5 shadow-card sm:p-6 ${className}`}>{children}</section>;
}

function SectionTitle({ eyebrow, title, note, action }: { eyebrow: string; title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</p>
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {note && <p className="mt-1 max-w-2xl text-sm leading-5 text-muted">{note}</p>}
      </div>
      {action}
    </div>
  );
}

function Label({ children, htmlFor }: PropsWithChildren<{ htmlFor?: string }>) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-foreground">{children}</label>;
}

function App() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [steps, setSteps] = useState(initialSteps);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [voicePreview, setVoicePreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const announce = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const copyPm = async () => {
    try {
      await navigator.clipboard.writeText(steps.map((step, index) => `${index + 1}. ${step}`).join("\n"));
      setCopied(true);
      announce("Sample PM steps copied to the clipboard.");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      announce("Clipboard access is unavailable in this preview.");
    }
  };

  const updateStep = (index: number, value: string) => {
    setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? value : step));
  };

  const addStep = () => {
    if (steps.length >= 15) return;
    setSteps((current) => [...current, "Add a maintenance instruction for planner review."]);
  };

  return (
    <Dialog.Root open={uploadOpen} onOpenChange={setUploadOpen}>
    <>
    <div className="min-h-screen bg-canvas text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[238px] flex-col border-r border-border bg-panel-muted px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <img src={macroCapLogo} alt="MacroCap Labs" className="h-auto w-[105px] object-contain" />
          <span className="h-8 w-px bg-border" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">PlannerMC</p>
            <p className="mt-1 text-[10px] text-muted">Design workspace</p>
          </div>
        </div>

        <div className="mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Workspace</div>
        <nav aria-label="Primary navigation" className="mt-2 flex flex-col gap-1">
          {sections.map(({ name, icon: Icon }) => (
            <button
              key={name}
              type="button"
              aria-current={activeSection === name ? "page" : undefined}
              onClick={() => setActiveSection(name)}
              className={`flex min-h-10 items-center gap-3 rounded-control px-3 text-left text-sm transition-colors ${activeSection === name ? "bg-panel-raised text-foreground" : "text-muted hover:bg-panel hover:text-foreground"}`}
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span>{name}</span>
              {activeSection === name && <span className="ml-auto h-1.5 w-1.5 rounded-pill bg-accent" aria-hidden="true" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-card border border-border bg-panel-muted p-3.5">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground"><Sparkles size={15} className="text-accent" aria-hidden="true" /> Design preview</div>
          <p className="mt-2 text-xs leading-5 text-muted">Component states use sample content. No work is saved or sent.</p>
          <button type="button" onClick={() => announce("This gallery documents visual primitives for the next build step.")} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
            About this preview <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[238px]">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-canvas/95 px-4 backdrop-blur sm:px-7">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="truncate text-muted">PlannerMC</span>
            <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate font-medium text-foreground">Design system</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="blue"><span className="h-1.5 w-1.5 rounded-pill bg-ring" aria-hidden="true" />Preview</Badge>
            <button type="button" aria-label="Help about the design preview" onClick={() => announce("This page presents isolated visual components and their states.")} className="hidden h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-panel-raised hover:text-foreground sm:inline-flex">
              <CircleHelp size={17} aria-hidden="true" />
            </button>
            <button type="button" aria-label="User menu, sample account" onClick={() => announce("Sample account menu preview.")} className="inline-flex h-9 items-center gap-2 rounded-control border border-border bg-panel px-2.5 text-xs text-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-pill bg-panel-raised text-muted"><UserRound size={12} aria-hidden="true" /></span>
              <span className="hidden sm:inline">Planner</span>
              <ChevronDown size={13} className="text-muted" aria-hidden="true" />
            </button>
          </div>
        </header>

        <nav aria-label="Mobile navigation" className="scrollbar-subtle flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
          {sections.map(({ name, icon: Icon }) => (
            <button key={name} type="button" onClick={() => setActiveSection(name)} aria-current={activeSection === name ? "page" : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-control px-3 py-2 text-xs ${activeSection === name ? "bg-panel-raised text-foreground" : "text-muted hover:bg-panel"}`}>
              <Icon size={15} aria-hidden="true" />{name}
            </button>
          ))}
        </nav>

        <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-7 sm:px-7 sm:pt-9 xl:px-10">
          <div className="mb-7 flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-pill border border-brand-cyan/35 bg-brand-cyan/10 px-3 py-1.5 text-xs font-medium text-brand-cyan">
                <span className="h-1.5 w-1.5 rounded-pill bg-brand-cyan" aria-hidden="true" />PlannerMC · Visual language
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">Design system</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">A practical component set for evidence-led maintenance planning, review, and clear handoff.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton variant="secondary" onClick={() => announce("This preview does not persist changes.")}><EyeIcon />View states</ActionButton>
              <Dialog.Trigger asChild><ActionButton variant="primary"><Upload size={15} aria-hidden="true" />Import manual</ActionButton></Dialog.Trigger>
            </div>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-card border border-border bg-panel-muted px-4 py-3.5 text-sm">
            <Info size={17} className="mt-0.5 shrink-0 text-ring" aria-hidden="true" />
            <p className="leading-5 text-muted"><span className="font-medium text-foreground">Design preview.</span> All names and maintenance examples are sample content. Controls demonstrate visual states only; they do not save records, upload manuals, or contact services.</p>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
            <GalleryCard>
              <SectionTitle eyebrow="01 · Identity" title="Brand and application shell" note="MacroCap Labs identity paired with PlannerMC as the product name." />
              <div className="grid gap-4 md:grid-cols-[1.05fr_.95fr]">
                <div className="flex min-h-44 flex-col justify-between rounded-card border border-border bg-panel-muted p-5">
                  <div className="flex items-center gap-4">
                    <img src={macroCapLogo} alt="MacroCap Labs" className="h-auto w-36 max-w-[56%] object-contain" />
                    <span className="h-10 w-px bg-border" aria-hidden="true" />
                    <span className="text-lg font-semibold tracking-tight">PlannerMC</span>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-2">
                    <Badge tone="success"><CheckCircle2 size={13} aria-hidden="true" />Ready for review</Badge>
                    <Badge tone="warning"><Clock3 size={13} aria-hidden="true" />Needs attention</Badge>
                  </div>
                </div>
                <div className="rounded-card border border-border bg-panel-muted p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-control border border-border bg-panel-raised text-accent"><ListChecks size={17} aria-hidden="true" /></div>
                    <div><p className="text-sm font-semibold">Maintenance planning</p><p className="mt-0.5 text-xs text-muted">Evidence · Assets · PMs</p></div>
                    <button type="button" aria-label="More application shell options" onClick={() => announce("Application shell options preview.")} className="ml-auto rounded-control p-2 text-muted hover:bg-panel-raised"><MoreHorizontal size={16} aria-hidden="true" /></button>
                  </div>
                  <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted"><span>Area</span><ChevronRight size={13} aria-hidden="true" /><span className="text-foreground">North process line</span><ChevronRight size={13} aria-hidden="true" /><span className="truncate text-foreground">Equipment review</span></div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-brand-cyan" />Logo cyan <code className="text-foreground">#00A7CA</code></span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-brand-green" />Logo green <code className="text-foreground">#59BB4E</code></span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-accent" />Action <code className="text-foreground">#BCD3E0</code></span>
              </div>
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="02 · Actions" title="Buttons and control states" note="Clear hierarchy, visible keyboard focus, and named icon-only actions." />
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <ActionButton variant="primary"><Plus size={15} aria-hidden="true" />Create PM</ActionButton>
                  <ActionButton variant="secondary"><FileText size={15} aria-hidden="true" />Open source</ActionButton>
                  <ActionButton variant="ghost"><Search size={15} aria-hidden="true" />Find</ActionButton>
                  <ActionButton variant="danger"><X size={15} aria-hidden="true" />Remove</ActionButton>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <ActionButton size="sm" variant="primary">Small action</ActionButton>
                  <ActionButton size="sm" variant="secondary">Secondary</ActionButton>
                  <ActionButton size="sm" disabled><LoaderCircle size={14} className="animate-spin" aria-hidden="true" />Loading</ActionButton>
                  <ActionButton size="sm" disabled>Disabled</ActionButton>
                  <button type="button" aria-label="Copy sample item" onClick={() => announce("Sample item copied.")} className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border-input bg-panel-raised text-muted hover:text-foreground"><Copy size={15} aria-hidden="true" /></button>
                </div>
                <p className="text-xs text-muted">Tab to a control to see the 2 px focus outline. The standalone copy button has an accessible name.</p>
              </div>
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="03 · Inputs" title="Text fields and search" note="Native controls keep browser keyboard and form behavior." />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="equipment-search">Equipment or tag</Label>
                  <div className="relative">
                    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                    <input id="equipment-search" type="search" placeholder="Search equipment" className="h-10 w-full rounded-control border border-border-input bg-panel-muted pl-9 pr-3 text-sm text-foreground placeholder:text-muted" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="frequency">Interval</Label>
                  <div className="relative">
                    <select id="frequency" defaultValue="monthly" className="h-10 w-full appearance-none rounded-control border border-border-input bg-panel-muted px-3 pr-9 text-sm text-foreground">
                      <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
                    </select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="task-name">PM title</Label>
                  <input id="task-name" type="text" defaultValue="Routine equipment inspection" className="h-10 w-full rounded-control border border-border-input bg-panel-muted px-3 text-sm text-foreground" />
                  <p className="mt-1.5 text-xs text-muted">Use a short, specific title. The sample value is editable in this preview.</p>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea id="notes" rows={2} placeholder="Add a note for the reviewer" className="w-full resize-y rounded-control border border-border-input bg-panel-muted px-3 py-2.5 text-sm leading-5 text-foreground placeholder:text-muted" />
                </div>
              </div>
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="04 · Intake" title="Manual upload" note="File selection state with the next step kept explicit." action={<Badge>Optional source</Badge>} />
              <div className="rounded-card border border-dashed border-border-input bg-panel-muted p-5 text-center sm:p-7">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-card border border-border bg-panel text-accent"><Upload size={19} aria-hidden="true" /></div>
                <p className="mt-3 text-sm font-medium text-foreground">Add a manual or reference file</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted">Select a file to preview the chosen state. This gallery does not upload it.</p>
                <label htmlFor="sample-manual" className="mt-4 inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-control border border-border-input bg-panel-raised px-3 text-xs font-medium text-foreground hover:bg-panel-raised/80">
                  <FileText size={14} aria-hidden="true" />Choose a file
                  <input id="sample-manual" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? "")} />
                </label>
                <p className="mt-3 text-[11px] text-muted">PDF, Word, or image · File size rules are defined during implementation</p>
              </div>
              {selectedFile && <div className="mt-3 flex items-center gap-2 rounded-control border border-border bg-panel-muted px-3 py-2 text-xs"><FileText size={14} className="text-accent" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{selectedFile}</span><button type="button" aria-label={`Remove selected file ${selectedFile}`} onClick={() => setSelectedFile("")} className="rounded p-1 text-muted hover:text-foreground"><X size={14} aria-hidden="true" /></button></div>}
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="05 · Traceability" title="Evidence and limitations" note="The source, locator, and confidence boundary stay visible together." />
              <div className="rounded-card border border-border bg-panel-muted p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-control border border-border bg-panel text-accent"><BookOpenText size={18} aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">Equipment care guide</p><Badge tone="success"><Check size={12} aria-hidden="true" />Source linked</Badge></div>
                    <p className="mt-1 text-xs text-muted">Sample manual · Page 18 · Section 4.2</p>
                    <p className="mt-3 text-sm leading-5 text-foreground">“Review the equipment exterior and record visible changes.”</p>
                  </div>
                  <button type="button" aria-label="Open sample evidence details" onClick={() => announce("Evidence detail preview.")} className="rounded-control p-2 text-muted hover:bg-panel-raised hover:text-foreground"><ArrowDownToLine size={15} aria-hidden="true" /></button>
                </div>
              </div>
              <div className="mt-3 flex gap-3 rounded-card border border-warning/35 bg-warning/5 p-4">
                <ShieldAlert size={17} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
                <div><p className="text-sm font-medium text-warning">Evidence has limits</p><p className="mt-1 text-xs leading-5 text-muted">This sample excerpt does not establish site-specific isolation, acceptance criteria, or instrument settings. Keep those items open for qualified review.</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2"><Badge tone="blue">Source: manual</Badge><Badge>Locator retained</Badge><Badge tone="warning"><AlertTriangle size={12} aria-hidden="true" />Review required</Badge></div>
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="06 · Structure" title="Equipment and sub-assets" note="One parent with direct children; no deeper hierarchy is shown." />
              <div className="overflow-hidden rounded-card border border-border bg-panel-muted">
                <div className="flex items-center gap-3 border-b border-border bg-panel px-4 py-3">
                  <div className="grid h-9 w-9 place-items-center rounded-control border border-border bg-panel-raised text-accent"><Activity size={16} aria-hidden="true" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Air compressor · AC-204</p><p className="mt-0.5 text-xs text-muted">Parent equipment · Sample record</p></div>
                  <Badge tone="success">Confirmed</Badge>
                  <button type="button" aria-label="More options for Air compressor AC-204" onClick={() => announce("Asset actions preview.")} className="rounded-control p-2 text-muted hover:bg-panel-raised"><MoreHorizontal size={15} aria-hidden="true" /></button>
                </div>
                <div className="space-y-2 p-3 sm:pl-8">
                  {["Electric motor · M-204", "Air-end assembly · AE-204"].map((asset) => <div key={asset} className="flex items-center gap-3 rounded-control border border-border bg-panel px-3 py-2.5"><span className="h-4 w-4 shrink-0 border-b border-l border-border" aria-hidden="true" /><div className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-panel-raised text-muted"><Activity size={14} aria-hidden="true" /></div><span className="min-w-0 flex-1 truncate text-xs font-medium">{asset}</span><Badge>Sub-asset</Badge></div>)}
                </div>
              </div>
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="07 · Maintenance plan" title="PM step editor" note="Editable list with a hard cap of 15 steps and clear empty behavior." action={<Badge tone="blue"><ListChecks size={12} aria-hidden="true" />{steps.length} / 15</Badge>} />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-panel-muted px-3.5 py-3">
                <div><p className="text-sm font-semibold">Routine equipment inspection</p><p className="mt-1 text-xs text-muted">Monthly · Sample PM · Draft</p></div>
                <Badge tone="neutral">English output</Badge>
              </div>
              <ol className="space-y-2" aria-label="Maintenance plan steps">
                {steps.map((step, index) => <li key={`${index}-${step.slice(0, 10)}`} className="flex items-start gap-2 rounded-control border border-border bg-panel-muted p-2.5">
                  <span className="mt-2 grid h-5 w-5 shrink-0 place-items-center rounded-pill border border-border-input text-[10px] font-medium text-muted">{index + 1}</span>
                  <input aria-label={`Step ${index + 1}`} value={step} onChange={(event) => updateStep(index, event.target.value)} className="min-w-0 flex-1 bg-transparent px-1 py-1 text-xs leading-5 text-foreground" />
                  <button type="button" aria-label={`Remove step ${index + 1}`} onClick={() => setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index))} className="mt-0.5 rounded-control p-1.5 text-muted hover:bg-panel-raised hover:text-foreground"><X size={14} aria-hidden="true" /></button>
                </li>)}
              </ol>
              {steps.length === 0 && <p className="rounded-control border border-dashed border-border-input px-3 py-5 text-center text-xs text-muted">No steps yet. Add a planner-authored step to continue.</p>}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <ActionButton size="sm" onClick={addStep} disabled={steps.length >= 15}><Plus size={14} aria-hidden="true" />Add step</ActionButton>
                <span className="text-[11px] text-muted">Maximum 15 per PM</span>
              </div>
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="08 · Review" title="Draft, approval, and versions" note="Review states remain distinct from evidence status." />
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral"><FileText size={12} aria-hidden="true" />Draft</Badge>
                <Badge tone="warning"><Clock3 size={12} aria-hidden="true" />Ready for review</Badge>
                <Badge tone="success"><CheckCircle2 size={12} aria-hidden="true" />Approved</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionButton variant="primary" onClick={() => announce("Draft action preview only. No record was saved.")}><Check size={15} aria-hidden="true" />Save draft</ActionButton>
                <ActionButton onClick={() => announce("Approval state preview only. No approval was recorded.")}><FileCheck2 size={15} aria-hidden="true" />Preview approval</ActionButton>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Version history</p><button type="button" onClick={() => announce("All versions are visible in this sample.")} className="text-xs font-medium text-accent hover:underline">View all</button></div>
                <div className="space-y-3">
                  {[{ version: "v3", title: "Review-ready draft", meta: "Today · Planner", tone: "warning" as const }, { version: "v2", title: "Source-linked revision", meta: "Yesterday · Planner", tone: "blue" as const }, { version: "v1", title: "Initial draft", meta: "Oct 24 · Planner", tone: "neutral" as const }].map((item) => <div key={item.version} className="flex items-center gap-3"><span className="grid h-7 w-8 place-items-center rounded-control border border-border bg-panel-muted text-[10px] font-semibold text-muted">{item.version}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-foreground">{item.title}</p><p className="mt-0.5 text-[11px] text-muted">{item.meta}</p></div><Badge tone={item.tone}>{item.version === "v3" ? "Current" : "Saved"}</Badge></div>)}
                </div>
              </div>
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="09 · Conversation" title="Text and voice composer" note="Spanish input and English document output can coexist in one workflow." />
              <div className="mb-3 flex items-center gap-1 rounded-control border border-border bg-panel-muted p-1" role="group" aria-label="Input mode">
                <button type="button" onClick={() => setVoicePreview(false)} aria-pressed={!voicePreview} className={`flex min-h-8 flex-1 items-center justify-center gap-2 rounded px-3 text-xs font-medium ${!voicePreview ? "bg-panel-raised text-foreground" : "text-muted hover:text-foreground"}`}><MessageSquareText size={14} aria-hidden="true" />Text input</button>
                <button type="button" onClick={() => setVoicePreview(true)} aria-pressed={voicePreview} className={`flex min-h-8 flex-1 items-center justify-center gap-2 rounded px-3 text-xs font-medium ${voicePreview ? "bg-panel-raised text-foreground" : "text-muted hover:text-foreground"}`}><AudioLines size={14} aria-hidden="true" />Voice input</button>
              </div>
              <div className="rounded-card border border-border-input bg-panel-muted p-3">
                <label htmlFor="conversation" className="sr-only">Message for PlannerMC</label>
                <textarea id="conversation" rows={3} placeholder="Describe the maintenance task or ask a question…" className="w-full resize-y bg-transparent text-sm leading-6 text-foreground placeholder:text-muted" />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                  <span className="text-[11px] text-muted">Input: Español <ChevronDown size={12} className="inline" aria-hidden="true" /> · PM document: English</span>
                  <div className="flex gap-2">
                    <ActionButton size="sm" variant={voicePreview ? "primary" : "secondary"} onClick={() => { setVoicePreview((value) => !value); announce("Voice capture is a visual preview; no audio is recorded."); }}><Mic size={14} aria-hidden="true" />{voicePreview ? "Stop preview" : "Voice preview"}</ActionButton>
                    <ActionButton size="sm" variant="primary" onClick={() => announce("Message preview only. Nothing was sent.")} aria-label="Preview send message"><ArrowRight size={15} aria-hidden="true" /></ActionButton>
                  </div>
                </div>
              </div>
              {voicePreview && <div role="status" className="mt-3 flex items-center gap-2 rounded-control border border-ring/35 bg-ring/5 px-3 py-2 text-xs text-ring"><Headphones size={14} aria-hidden="true" />Voice capture preview. No microphone is active and no audio is recorded.</div>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-panel-muted p-3.5">
                <div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-control border border-border bg-panel text-accent"><Sparkles size={15} aria-hidden="true" /></div><div><p className="text-xs font-medium">Response language</p><p className="mt-0.5 text-[11px] text-muted">Conversation: Spanish · PM: English</p></div></div>
                <Badge tone="blue">Language pair</Badge>
              </div>
            </GalleryCard>

            <GalleryCard>
              <SectionTitle eyebrow="10 · Handoff" title="Copy actions" note="Simple transfer controls with immediate confirmation." />
              <div className="rounded-card border border-border bg-panel-muted p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-sm font-semibold">Routine equipment inspection</p><p className="mt-1 text-xs text-muted">3 sample steps · English</p></div>
                  <Badge tone="success"><CheckCircle2 size={12} aria-hidden="true" />Ready to copy</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton variant="primary" onClick={copyPm}>{copied ? <ClipboardCheck size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}{copied ? "Copied" : "Copy PM"}</ActionButton>
                  <ActionButton onClick={() => announce("Step copy action preview. Select a step to enable the next implementation flow.")}><Clipboard size={15} aria-hidden="true" />Copy selected step</ActionButton>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-muted">Copying moves sample text to the local clipboard only. No CMMS or other service is contacted.</p>
              </div>
            </GalleryCard>
          </div>

          <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted">
            <span>PlannerMC design preview · Sample data only</span>
            <span>MacroCap Labs identity · Geist Variable · Lucide icons</span>
          </footer>
        </main>
      </div>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-panel border border-border-input bg-panel p-5 shadow-popover data-[state=open]:animate-fade-in sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><Dialog.Title className="text-base font-semibold text-foreground">Add a source manual</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-5 text-muted">Choose a local file to preview the intake state. This component does not upload or retain the file.</Dialog.Description></div>
              <Dialog.Close asChild><button type="button" aria-label="Close manual dialog" className="rounded-control p-2 text-muted hover:bg-panel-raised hover:text-foreground"><X size={16} aria-hidden="true" /></button></Dialog.Close>
            </div>
            <div className="mt-5 rounded-card border border-dashed border-border-input bg-panel-muted p-5 text-center">
              <FileText size={22} className="mx-auto text-accent" aria-hidden="true" />
              <p className="mt-2 text-sm font-medium">Choose a sample document</p>
              <p className="mt-1 text-xs text-muted">PDF, Word, or image file</p>
              <label htmlFor="dialog-manual" className="mt-4 inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-control border border-border-input bg-panel-raised px-3 text-xs font-medium hover:bg-panel-raised/80"><Upload size={14} aria-hidden="true" />Browse files<input id="dialog-manual" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => { const fileName = event.target.files?.[0]?.name ?? ""; setSelectedFile(fileName); if (fileName) { setUploadOpen(false); announce("File selected for visual preview only. Nothing was uploaded."); } }} /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2"><Dialog.Close asChild><ActionButton>Cancel</ActionButton></Dialog.Close></div>
          </Dialog.Content>
        </Dialog.Portal>

      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-4 left-1/2 z-[60] -translate-x-1/2">
        {notice && <div role="status" className="flex max-w-[calc(100vw-24px)] items-center gap-2 rounded-control border border-border-input bg-panel-raised px-4 py-3 text-sm text-foreground shadow-popover"><CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" /><span>{notice}</span></div>}
      </div>
    </div>
    </>
    </Dialog.Root>
  );
}

function EyeIcon() {
  return <Info size={15} aria-hidden="true" />;
}

export default App;
