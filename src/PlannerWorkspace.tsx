import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type PropsWithChildren } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderTree,
  ListChecks,
  LogOut,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  createAnalysis,
  createEmptyPm,
  createId,
  createPlannerEvidence,
  MAX_PM_STEPS,
  openingPmStep,
  pmApprovalIssues,
  PLANNER_EVIDENCE_BASE_LIMITATION,
  renderPmText,
  sampleCatalog,
  totalPmSteps,
  type AssetProposal,
  type CatalogLocation,
  type EvidenceApplicability,
  type OperatingState,
  type PlannerAnalysis,
  type PlannerEvidence,
  type PmDraft,
} from "./domain/planner";
import { plannerStore, type WorkspaceSnapshot } from "./data/local-prototype-store";
import { httpPlannerStore } from "./data/http-planner-store";
import { backendMode, supabaseClient } from "./data/supabase-client";

const logoUrl = "https://ops.macrocaplabs.com/macrocap-labs-logo-auth-384-v2.avif";
const dataStore = backendMode ? httpPlannerStore : plannerStore;

const flowSteps = [
  { label: "Intake", caption: "Equipment details", icon: Wrench },
  { label: "Evidence", caption: "Review limits", icon: FileText },
  { label: "Assets", caption: "Confirm structure", icon: FolderTree },
  { label: "PM draft", caption: "Review and approve", icon: ListChecks },
];

function ActionButton({
  variant = "secondary",
  className = "",
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }>) {
  const style = {
    primary: "border-transparent bg-accent text-accent-foreground hover:bg-accent/90",
    secondary: "border-border-input bg-panel-raised text-foreground hover:bg-panel-raised/80",
    ghost: "border-transparent bg-transparent text-muted hover:bg-panel-raised hover:text-foreground",
    danger: "border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
  }[variant];
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-control border px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-border disabled:bg-panel-muted disabled:text-muted ${style} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Field({ label, htmlFor, hint, children }: PropsWithChildren<{ label: string; htmlFor: string; hint?: string }>) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

const controlClass = "min-h-10 w-full rounded-control border border-border-input bg-panel-muted px-3 text-sm text-foreground placeholder:text-muted";
const textAreaClass = "min-h-28 w-full rounded-control border border-border-input bg-panel-muted px-3 py-2.5 text-sm leading-6 text-foreground placeholder:text-muted";

function PlannerWorkspace() {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>({ analyses: [], currentAnalysisId: null, catalog: sampleCatalog });
  const [analysis, setAnalysis] = useState<PlannerAnalysis | null>(null);
  const [pm, setPm] = useState<PmDraft | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [continueWithLimitations, setContinueWithLimitations] = useState(false);
  const [parentAcknowledged, setParentAcknowledged] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [approvalIssues, setApprovalIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const noticeTimeoutRef = useRef<number | undefined>(undefined);
  const [authReady, setAuthReady] = useState(!backendMode);
  const [authenticated, setAuthenticated] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [passwordActionRequired, setPasswordActionRequired] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      setLoading(true);
      setError("");
      try {
        const loaded = await dataStore.load();
        if (!active) return;
        setSnapshot(loaded);
        const selected = loaded.analyses.find((item) => item.id === loaded.currentAnalysisId) ?? loaded.analyses[0] ?? null;
        if (selected) {
          setAnalysis(selected);
          setStep(Math.min(selected.stage, 3));
          setPm(selected.pm ?? (selected.stage >= 3 ? createEmptyPm(selected) : null));
          setContinueWithLimitations(selected.evidenceDecision === "continue_with_limitations");
        } else {
          setAnalysis(null);
          setPm(null);
        }
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Workspace data could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (!backendMode) {
      void loadWorkspace();
      return () => { active = false; };
    }
    if (!supabaseClient) {
      setAuthReady(true);
      setLoading(false);
      setError("Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before selecting Supabase mode.");
      return () => { active = false; };
    }

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setAuthReady(true);
      setAuthenticated(Boolean(session));
      setAccountEmail(session?.user.email ?? "");
      const metadata = session?.user.user_metadata as Record<string, unknown> | undefined;
      const invitedWithoutPassword = Boolean(session?.user.invited_at) && metadata?.plannermc_password_set !== true;
      setPasswordActionRequired(Boolean(session && (event === "PASSWORD_RECOVERY" || invitedWithoutPassword)));
      if (session) {
        window.setTimeout(() => { if (active) void loadWorkspace(); }, 0);
      } else {
        setSnapshot({ analyses: [], currentAnalysisId: null, catalog: [] });
        setAnalysis(null);
        setPm(null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => () => {
    if (noticeTimeoutRef.current !== undefined) window.clearTimeout(noticeTimeoutRef.current);
  }, []);

  const confirmedAssets = useMemo(() => analysis?.assets.filter((asset) => asset.confirmed) ?? [], [analysis]);
  function showNotice(message: string) {
    if (noticeTimeoutRef.current !== undefined) window.clearTimeout(noticeTimeoutRef.current);
    setNotice(message);
    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice("");
      noticeTimeoutRef.current = undefined;
    }, 3200);
  }

  async function saveRecord(candidate: PlannerAnalysis, message: string): Promise<PlannerAnalysis | null> {
    if (savingRef.current) return null;
    savingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const updated = { ...candidate, updatedAt: new Date().toISOString() };
      const next = await dataStore.saveAnalysis(updated);
      const saved = next.analyses.find((item) => item.id === updated.id);
      if (!saved) throw new Error("The server did not return the saved analysis after read-back.");
      setSnapshot(next);
      setAnalysis(saved);
      showNotice(backendMode ? `${message} Verified in Supabase PostgreSQL.` : message);
      return saved;
    } catch (caught) {
      const fallback = backendMode ? "The server save could not be verified." : "The local save could not be verified.";
      setError(caught instanceof Error ? caught.message : fallback);
      return null;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function startAnalysis() {
    if (snapshot.catalog.length === 0) {
      setError("No locations and areas are configured for this workspace. Contact the PlannerMC operator.");
      return;
    }
    let created: PlannerAnalysis;
    try {
      created = createAnalysis(snapshot.catalog);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "An analysis could not be started.");
      return;
    }
    const saved = await saveRecord(created, "Analysis started and read back.");
    if (saved) {
      setStep(0);
      setPm(null);
      setContinueWithLimitations(false);
      setParentAcknowledged(false);
      setReviewed(false);
      setApprovalIssues([]);
    }
  }

  function selectAnalysis(id: string) {
    setError("");
    const selected = snapshot.analyses.find((item) => item.id === id);
    if (!selected) {
      setError("That analysis could not be found in this workspace.");
      return;
    }
    setSnapshot((current) => ({ ...current, currentAnalysisId: id }));
    setAnalysis(selected);
    setStep(Math.min(selected.stage, 3));
    setPm(selected.pm ?? (selected.stage >= 3 ? createEmptyPm(selected) : null));
    setContinueWithLimitations(selected.evidenceDecision === "continue_with_limitations");
    setParentAcknowledged(false);
    setReviewed(false);
    setApprovalIssues([]);
  }

  function updateAnalysis<K extends keyof PlannerAnalysis>(key: K, value: PlannerAnalysis[K]) {
    setAnalysis((current) => current ? { ...current, [key]: value } : current);
  }

  function updatePlannerEvidence(evidence: PlannerEvidence) {
    updateAnalysis("plannerEvidence", evidence);
    setContinueWithLimitations(false);
  }

  async function saveIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!analysis) return;
    if (!analysis.equipmentName.trim() || !analysis.plannerNotes.trim()) {
      setError("Enter an equipment name and the information you are supplying as the planner.");
      return;
    }
    const saved = await saveRecord({ ...analysis, stage: Math.max(analysis.stage, 1) }, "Intake saved and read back.");
    if (saved) {
      setStep(1);
      setContinueWithLimitations(saved.evidenceDecision === "continue_with_limitations");
    }
  }

  async function continueFromEvidence() {
    if (!analysis || !continueWithLimitations) {
      setError("Confirm that you want to continue with the limitations shown above.");
      return;
    }
    const source = analysis.plannerEvidence;
    if (!source || !source.title.trim()) {
      setError("Add a reference label before continuing to the asset proposal.");
      return;
    }
    let assets = analysis.assets;
    if (!assets.some((asset) => asset.kind === "equipment")) {
      assets = [{ id: createId(), kind: "equipment", name: analysis.equipmentName.trim(), sourceTerm: analysis.originalEquipmentName.trim(), confirmed: false }];
    }
    const reviewedEvidence = { ...source, reviewedAt: new Date().toISOString() };
    const saved = await saveRecord({ ...analysis, plannerEvidence: reviewedEvidence, assets, evidenceDecision: "continue_with_limitations", stage: Math.max(analysis.stage, 2) }, "Source review and decision saved and read back.");
    if (saved) {
      setStep(2);
      setParentAcknowledged(false);
    }
  }

  function updateAsset(assetId: string, changes: Partial<AssetProposal>) {
    if (!analysis) return;
    updateAnalysis("assets", analysis.assets.map((asset) => asset.id === assetId ? { ...asset, ...changes } : asset));
  }

  function addSubasset() {
    if (!analysis) return;
    updateAnalysis("assets", [...analysis.assets, { id: createId(), kind: "subasset", name: "", sourceTerm: "", confirmed: false }]);
  }

  function removeAsset(assetId: string) {
    if (!analysis) return;
    updateAnalysis("assets", analysis.assets.filter((asset) => asset.id !== assetId));
  }

  async function continueFromAssets() {
    if (!analysis) return;
    if (analysis.pm?.status === "approved") {
      setPm(analysis.pm);
      setStep(3);
      return;
    }
    const active = analysis.assets.filter((asset) => asset.confirmed);
    if (!active.length) {
      setError("Confirm at least one asset to create its maintenance plan.");
      return;
    }
    const rootConfirmed = analysis.assets.some((asset) => asset.kind === "equipment" && asset.confirmed);
    const childConfirmed = analysis.assets.some((asset) => asset.kind === "subasset" && asset.confirmed);
    if (!rootConfirmed && childConfirmed && !parentAcknowledged) {
      setError("The equipment is not confirmed, while a sub-asset is. Review and acknowledge this relationship before continuing.");
      return;
    }
    const saved = await saveRecord({ ...analysis, stage: Math.max(analysis.stage, 3) }, "Asset selection saved and read back.");
    if (saved) {
      const nextPm = saved.pm ?? createEmptyPm(saved);
      setPm(nextPm);
      setStep(3);
      setReviewed(false);
      setApprovalIssues([]);
    }
  }

  async function savePmDraft() {
    if (!analysis || !pm) return;
    if (pm.status === "approved") return;
    const saved = await saveRecord({ ...analysis, pm: { ...pm, status: "draft", approvedAt: undefined }, stage: 3 }, "PM draft saved and read back.");
    if (saved) setPm(saved.pm ?? pm);
  }

  async function approvePm() {
    if (!analysis || !pm) return;
    const issues = pmApprovalIssues(pm, confirmedAssets);
    if (!reviewed) issues.unshift("Confirm that you reviewed this planner-authored PM.");
    setApprovalIssues(issues);
    if (issues.length) {
      setError("Review the listed items before approval.");
      return;
    }
    const approved: PmDraft = { ...pm, status: "approved", approvedAt: new Date().toISOString() };
    const saved = await saveRecord({ ...analysis, pm: approved, stage: 3 }, "PM approved and verified. Nothing was sent to a CMMS.");
    if (saved?.pm) setPm(saved.pm);
  }

  async function copyText(text: string, message: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable in this browser context.");
      await navigator.clipboard.writeText(text);
      showNotice(message);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Clipboard access failed. Select and copy the text manually.");
    }
  }

  function copyPm() {
    if (analysis && pm) void copyText(renderPmText(analysis, pm, snapshot.catalog), "PM copied to the local clipboard.");
  }

  function copyStep(label: string, text: string) {
    void copyText(`${label}. ${text}`, "Step copied to the local clipboard.");
  }

  function changeStep(target: number) {
    if (!analysis || target > analysis.stage || target < 0) return;
    setError("");
    setStep(target);
    if (target === 3) setPm(analysis.pm ?? createEmptyPm(analysis));
  }

  async function signIn(email: string, password: string) {
    setError("");
    if (!supabaseClient) return;
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (signInError) setError("Sign-in failed. Check your credentials or contact the PlannerMC operator.");
  }

  async function signOut() {
    if (!supabaseClient) return;
    const { error: signOutError } = await supabaseClient.auth.signOut();
    if (signOutError) setError("Sign-out could not be completed. Try again.");
  }

  async function setAccountPassword(password: string) {
    setError("");
    if (!supabaseClient) return;
    const { error: passwordError } = await supabaseClient.auth.updateUser({
      password,
      data: { plannermc_password_set: true },
    });
    if (passwordError) {
      setError("The password could not be updated. Check the requirements or contact the PlannerMC operator.");
      return;
    }
    setPasswordActionRequired(false);
    setError("");
  }

  const sortedAnalyses = [...snapshot.analyses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (backendMode && !supabaseClient) return <BackendConfigNotice />;
  if (backendMode && !authReady) return <LoadingState />;
  if (backendMode && !authenticated) return <SignInGate error={error} onSignIn={signIn} />;
  if (backendMode && passwordActionRequired) return <PasswordChangeGate error={error} onUpdatePassword={setAccountPassword} />;

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-panel-muted px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-10 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Planner workspace</div>
        <nav aria-label="Main navigation" className="mt-3 flex flex-col gap-1">
          <a href="#workspace" className="flex min-h-10 items-center gap-3 rounded-control bg-panel-raised px-3 text-sm font-medium text-foreground">
            <ListChecks size={17} aria-hidden="true" />Work planning
          </a>
          <a href="/design" className="flex min-h-10 items-center gap-3 rounded-control px-3 text-sm text-muted hover:bg-panel hover:text-foreground">
            <FileText size={17} aria-hidden="true" />Design system
          </a>
        </nav>
        <div className="mt-8 flex items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Recent work</span>
          <button type="button" disabled={saving} onClick={() => void startAnalysis()} aria-label="Start a new analysis" className="rounded-control p-1.5 text-muted hover:bg-panel-raised hover:text-foreground disabled:opacity-50"><Plus size={16} aria-hidden="true" /></button>
        </div>
        <div className="mt-2 flex flex-col gap-1 overflow-y-auto">
          {sortedAnalyses.length === 0 && <p className="px-3 py-2 text-xs leading-5 text-muted">Saved analyses will appear here.</p>}
          {sortedAnalyses.map((item) => (
            <button key={item.id} type="button" onClick={() => selectAnalysis(item.id)} className={`truncate rounded-control px-3 py-2 text-left text-xs ${analysis?.id === item.id ? "bg-panel-raised text-foreground" : "text-muted hover:bg-panel hover:text-foreground"}`}>
              {item.equipmentName.trim() || "Untitled analysis"}
              <span className="mt-1 block truncate text-xs text-muted">{item.pm?.status === "approved" ? "PM approved" : item.stage >= 3 ? "PM draft" : flowSteps[Math.min(item.stage, 3)].label}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto rounded-card border border-border bg-panel p-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground"><UserRound size={14} className="text-accent" aria-hidden="true" />{backendMode ? "Supabase workspace" : "Local prototype"}</p>
          <p className="mt-2 text-xs leading-5 text-muted">{backendMode ? `Signed in as ${accountEmail}. Planner records are stored through the Fastify API.` : "No sign-in or server sync. Saved records stay in this browser."}</p>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-canvas/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3 lg:hidden"><Brand compact /></div>
          <div className="hidden items-center gap-2 text-sm lg:flex">
            <span className="text-muted">PlannerMC</span><ChevronRight size={14} className="text-muted" aria-hidden="true" />
            <span className="font-medium">Work planning</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted sm:inline">{backendMode ? accountEmail : "MacroCap Labs identity"}</span>
            <a href="/design" className="rounded-control px-2.5 py-2 text-xs font-medium text-accent hover:bg-panel-raised">Design gallery</a>
            {backendMode && <button type="button" disabled={saving} onClick={() => void signOut()} className="inline-flex min-h-9 items-center gap-1.5 rounded-control px-2.5 text-xs text-muted hover:bg-panel-raised hover:text-foreground disabled:opacity-50"><LogOut size={14} aria-hidden="true" />Sign out</button>}
          </div>
        </header>

        <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
          <a href="#workspace" className="shrink-0 rounded-control bg-panel-raised px-3 py-2 text-xs text-foreground">Work planning</a>
          <a href="/design" className="shrink-0 rounded-control px-3 py-2 text-xs text-muted">Design system</a>
          <button type="button" disabled={saving} onClick={() => void startAnalysis()} className="shrink-0 rounded-control px-3 py-2 text-xs text-muted disabled:opacity-50">New analysis</button>
        </nav>

        <main id="workspace" className="mx-auto max-w-6xl px-4 pb-16 pt-7 sm:px-7 sm:pt-9">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-cyan">Maintenance planning</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Work planning</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Build an asset proposal and a planner-authored maintenance procedure from information you provide.</p>
            </div>
            <ActionButton onClick={startAnalysis}><Plus size={16} aria-hidden="true" />New analysis</ActionButton>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-card border border-ring/30 bg-ring/5 px-4 py-3.5 text-sm">
            <ShieldAlert size={17} className="mt-0.5 shrink-0 text-ring" aria-hidden="true" />
            <p className="leading-5 text-muted">{backendMode ? <><span className="font-medium text-foreground">Authenticated backend.</span> PlannerMC records are sent to Fastify and saved in Supabase PostgreSQL. This slice does not inspect manuals, generate technical guidance, or connect to a CMMS.</> : <><span className="font-medium text-foreground">Local prototype.</span> This build uses a sample location catalog and saves only in this browser. It does not sign users in, inspect manuals, generate technical guidance, or connect to a CMMS.</>}</p>
          </div>

          {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"><AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden="true" /><p>{error}</p></div>}

          <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
          {loading ? <LoadingState /> : !analysis ? (
            <WelcomeState onStart={startAnalysis} analyses={sortedAnalyses} onSelect={selectAnalysis} />
          ) : (
            <>
              <div className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {flowSteps.map(({ label, caption, icon: Icon }, index) => {
                  const available = index <= analysis.stage;
                  const current = index === step;
                  const complete = index < analysis.stage || (index === 3 && analysis.pm?.status === "approved");
                  return (
                    <button key={label} type="button" disabled={!available} onClick={() => changeStep(index)} aria-current={current ? "step" : undefined} className={`flex min-h-16 items-center gap-3 rounded-card border px-3 py-3 text-left transition-colors ${current ? "border-ring/50 bg-panel" : complete ? "border-success/40 bg-success/5" : "border-border bg-panel-muted"} disabled:cursor-not-allowed disabled:opacity-60`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-control ${current ? "bg-accent text-accent-foreground" : complete ? "bg-success/15 text-success" : "bg-panel-raised text-muted"}`}>
                        {complete ? <Check size={17} aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}
                      </span>
                      <span className="min-w-0"><span className="block truncate text-sm font-medium">{label}</span><span className="mt-0.5 block truncate text-xs text-muted">{caption}</span></span>
                    </button>
                  );
                })}
              </div>

              {step === 0 && <IntakeStep analysis={analysis} catalog={snapshot.catalog} readOnly={analysis.stage >= 2} onChange={updateAnalysis} onSubmit={saveIntake} />}
              {step === 1 && <EvidenceStep analysis={analysis} catalog={snapshot.catalog} readOnly={analysis.stage >= 2 && Boolean(analysis.plannerEvidence?.reviewedAt)} acknowledged={continueWithLimitations} onAcknowledge={setContinueWithLimitations} onUpdateSource={updatePlannerEvidence} onBack={() => changeStep(0)} onContinue={continueFromEvidence} />}
              {step === 2 && <AssetsStep analysis={analysis} readOnly={analysis.pm?.status === "approved"} onUpdate={updateAsset} onAdd={addSubasset} onRemove={removeAsset} parentAcknowledged={parentAcknowledged} onParentAcknowledged={setParentAcknowledged} onBack={() => changeStep(1)} onContinue={continueFromAssets} />}
              {step === 3 && pm && <PmStep analysis={analysis} pm={pm} setPm={setPm} assets={confirmedAssets} reviewed={reviewed} onReviewed={setReviewed} issues={approvalIssues} catalog={snapshot.catalog} onBack={() => changeStep(2)} onSave={savePmDraft} onApprove={approvePm} onCopy={copyPm} onCopyStep={copyStep} />}
            </>
          )}
          </fieldset>
        </main>
      </div>

      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        {notice && <div role="status" className="flex max-w-lg items-center gap-2 rounded-control border border-border-input bg-panel-raised px-4 py-3 text-sm text-foreground shadow-popover"><CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" />{notice}</div>}
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src={logoUrl} alt="MacroCap Labs" className={compact ? "h-auto w-20 object-contain" : "h-auto w-24 object-contain"} />
      <span className="h-8 w-px bg-border" aria-hidden="true" />
      <div className="leading-tight"><p className="text-sm font-semibold">PlannerMC</p><p className="mt-1 text-xs text-muted">Work planning</p></div>
    </div>
  );
}

function BackendConfigNotice() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 text-foreground">
      <section className="w-full max-w-lg rounded-panel border border-border bg-panel p-6 shadow-card sm:p-8">
        <Brand />
        <h1 className="mt-8 text-2xl font-semibold">Backend configuration required</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Supabase mode is enabled, but the public project URL or publishable key is missing. Set the Vite environment values and restart the app.</p>
        <pre className="mt-5 overflow-x-auto rounded-control border border-border bg-panel-muted p-3 text-xs leading-5 text-muted">VITE_DATA_MODE=supabase{"\n"}VITE_SUPABASE_URL=https://your-project.supabase.co{"\n"}VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…</pre>
        <p className="mt-4 text-xs leading-5 text-muted">Never place the Supabase secret key or PostgreSQL connection string in a Vite environment variable.</p>
      </section>
    </div>
  );
}

function SignInGate({ error, onSignIn }: { error: string; onSignIn: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSignIn(email.trim(), password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-panel border border-border bg-panel p-6 shadow-card sm:p-8">
        <Brand />
        <p className="mt-9 text-xs font-semibold uppercase tracking-wider text-brand-cyan">Planner workspace</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Use the individual account sent to you by the PlannerMC operator.</p>
        {error && <div role="alert" className="mt-5 rounded-card border border-danger/40 bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</div>}
        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
          <Field label="Email" htmlFor="sign-in-email">
            <input id="sign-in-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className={controlClass} />
          </Field>
          <Field label="Password" htmlFor="sign-in-password">
            <input id="sign-in-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={controlClass} />
          </Field>
          <ActionButton type="submit" variant="primary" disabled={submitting} className="w-full">{submitting ? "Signing in…" : "Sign in"}</ActionButton>
        </form>
        <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">No public account registration. For an invitation or account recovery, contact the authorized PlannerMC operator.</p>
      </section>
    </div>
  );
}

function PasswordChangeGate({ error, onUpdatePassword }: { error: string; onUpdatePassword: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    if (password.length < 12) {
      setValidationError("Use at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setValidationError("The passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await onUpdatePassword(password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-panel border border-border bg-panel p-6 shadow-card sm:p-8">
        <Brand />
        <p className="mt-9 text-xs font-semibold uppercase tracking-wider text-brand-cyan">Account security</p>
        <h1 className="mt-2 text-2xl font-semibold">Set a password</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Choose the password you will use with your individual PlannerMC account.</p>
        {(error || validationError) && <div role="alert" className="mt-5 rounded-card border border-danger/40 bg-danger/10 px-3.5 py-3 text-sm text-danger">{validationError || error}</div>}
        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
          <Field label="New password" htmlFor="new-password"><input id="new-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} className={controlClass} /></Field>
          <Field label="Confirm password" htmlFor="confirm-password"><input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={controlClass} /></Field>
          <ActionButton type="submit" variant="primary" disabled={submitting} className="w-full">{submitting ? "Updating password…" : "Save password"}</ActionButton>
        </form>
      </section>
    </div>
  );
}

function LoadingState() {
  return <div role="status" className="rounded-panel border border-border bg-panel p-6"><span className="sr-only">Loading saved analyses</span><div className="h-4 w-40 animate-pulse rounded bg-panel-raised" /><div className="mt-4 h-3 w-full animate-pulse rounded bg-panel-raised" /><div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-panel-raised" /></div>;
}

function WelcomeState({ onStart, analyses, onSelect }: { onStart: () => void; analyses: PlannerAnalysis[]; onSelect: (id: string) => void }) {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="rounded-panel border border-border bg-panel p-6 shadow-card sm:p-8 xl:col-span-2">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-card border border-ring/30 bg-ring/10 text-ring"><Wrench size={21} aria-hidden="true" /></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Planner-led workflow</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Start with one piece of equipment</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Add the details you have, review what this prototype cannot verify, select the assets to keep, and write a PM for the confirmed asset.</p>
        <ActionButton variant="primary" onClick={onStart} className="mt-6"><Plus size={16} aria-hidden="true" />Start an analysis</ActionButton>
      </div>
      <div className="rounded-panel border border-border bg-panel p-5">
        <h2 className="text-sm font-semibold">{backendMode ? "Recent work" : "Resume local work"}</h2>
        {analyses.length === 0 ? <p className="mt-3 text-sm leading-6 text-muted">No saved analyses yet. Your first analysis will appear here after it is saved.</p> : <div className="mt-3 space-y-2">{analyses.slice(0, 5).map((item) => <button key={item.id} type="button" onClick={() => onSelect(item.id)} className="flex w-full items-center justify-between gap-3 rounded-control border border-border bg-panel-muted px-3 py-3 text-left hover:bg-panel-raised"><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.equipmentName || "Untitled analysis"}</span><span className="mt-1 block text-xs text-muted">{item.pm?.status === "approved" ? "Approved" : item.stage >= 3 ? "PM draft" : "In progress"}</span></span><ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" /></button>)}</div>}
      </div>
    </section>
  );
}

function IntakeStep({ analysis, catalog, readOnly, onChange, onSubmit }: { analysis: PlannerAnalysis; catalog: CatalogLocation[]; readOnly: boolean; onChange: <K extends keyof PlannerAnalysis>(key: K, value: PlannerAnalysis[K]) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void> }) {
  const location = catalog.find((item) => item.id === analysis.locationId) ?? catalog[0];
  return (
    <section className="rounded-panel border border-border bg-panel p-5 shadow-card sm:p-7">
      <StepTitle eyebrow="01 · Intake" title="Equipment and planner details" description={backendMode ? "One equipment item per analysis. Locations and areas are configured for this workspace." : "One equipment item per analysis. Locations below are synthetic sample data for this prototype."} />
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Location" htmlFor="location">
            <select id="location" disabled={readOnly} className={controlClass} value={analysis.locationId} onChange={(event) => { const next = catalog.find((item) => item.id === event.target.value) ?? catalog[0]; if (next) { onChange("locationId", next.id); onChange("areaId", next.areas[0]?.id ?? ""); } }}>
              {catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Area" htmlFor="area">
            <select id="area" disabled={readOnly} className={controlClass} value={analysis.areaId} onChange={(event) => onChange("areaId", event.target.value)}>
              {(location?.areas ?? []).map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
            </select>
          </Field>
          <Field label="Equipment name" htmlFor="equipment-name" hint="Use the name you want to see in the proposed asset hierarchy.">
            <input id="equipment-name" disabled={readOnly} className={controlClass} value={analysis.equipmentName} onChange={(event) => onChange("equipmentName", event.target.value)} placeholder="For example, Packaging conveyor 01" required />
          </Field>
          <Field label="Original equipment label" htmlFor="original-name" hint="Optional. Keep a source name here if you want to retain it as context.">
            <input id="original-name" disabled={readOnly} className={controlClass} value={analysis.originalEquipmentName} onChange={(event) => onChange("originalEquipmentName", event.target.value)} placeholder="Original label or tag" />
          </Field>
          <Field label="Manufacturer" htmlFor="manufacturer">
            <input id="manufacturer" disabled={readOnly} className={controlClass} value={analysis.manufacturer} onChange={(event) => onChange("manufacturer", event.target.value)} placeholder="Planner-provided, if known" />
          </Field>
          <Field label="Model" htmlFor="model">
            <input id="model" disabled={readOnly} className={controlClass} value={analysis.model} onChange={(event) => onChange("model", event.target.value)} placeholder="Planner-provided, if known" />
          </Field>
        </div>
        <Field label="Information you are supplying as the planner" htmlFor="planner-notes" hint="Describe the equipment function and the task or maintenance details you want to use. This prototype does not check the information against a manual or external reference.">
          <textarea id="planner-notes" disabled={readOnly} className={textAreaClass} value={analysis.plannerNotes} onChange={(event) => onChange("plannerNotes", event.target.value)} placeholder="Enter equipment function, known task details, and any relevant conditions…" required />
        </Field>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5">
          {readOnly ? <span className="text-xs text-muted">Intake is locked after the asset decision.</span> : <ActionButton type="submit" variant="primary">Save and review information <ArrowRight size={15} aria-hidden="true" /></ActionButton>}
        </div>
      </form>
    </section>
  );
}

function EvidenceStep({ analysis, catalog, readOnly, acknowledged, onAcknowledge, onUpdateSource, onBack, onContinue }: { analysis: PlannerAnalysis; catalog: CatalogLocation[]; readOnly: boolean; acknowledged: boolean; onAcknowledge: (checked: boolean) => void; onUpdateSource: (evidence: PlannerEvidence) => void; onBack: () => void; onContinue: () => void | Promise<void> }) {
  const location = catalog.find((item) => item.id === analysis.locationId);
  const area = location?.areas.find((item) => item.id === analysis.areaId);
  const evidence = analysis.plannerEvidence ?? createPlannerEvidence(analysis.id);
  const extraLimitations = evidence.limitations.filter((item) => item !== PLANNER_EVIDENCE_BASE_LIMITATION);
  const applicabilityLabels: Record<EvidenceApplicability, string> = {
    applicable: "Applicable to this equipment",
    different_variant: "Different equipment variant",
    unknown: "Not established",
    not_applicable: "Not applicable to this equipment",
  };
  function updateSource<K extends keyof PlannerEvidence>(key: K, value: PlannerEvidence[K]) {
    onUpdateSource({ ...evidence, [key]: value });
  }
  return (
    <section className="rounded-panel border border-border bg-panel p-5 shadow-card sm:p-7">
      <StepTitle eyebrow="02 · Evidence and decision" title="Review the information and its limits" description="The information below came from the planner. This build has not independently checked it." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-card border border-border bg-panel-muted p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><FileText size={16} className="text-accent" aria-hidden="true" />Planner-provided information</div>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-xs text-muted">Equipment</dt><dd className="mt-1 font-medium">{analysis.equipmentName || "Not provided"}</dd></div>
            <div><dt className="text-xs text-muted">Location / area</dt><dd className="mt-1">{location?.name} / {area?.name}</dd></div>
            {(analysis.manufacturer || analysis.model) && <div><dt className="text-xs text-muted">Manufacturer / model</dt><dd className="mt-1">{[analysis.manufacturer, analysis.model].filter(Boolean).join(" / ")}</dd></div>}
            <div><dt className="text-xs text-muted">Planner notes</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{analysis.plannerNotes || "No details provided."}</dd></div>
          </dl>
        </article>
        <article className="rounded-card border border-warning/40 bg-warning/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-warning"><AlertTriangle size={16} aria-hidden="true" />Limitations for this analysis</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
            <li>No manual, OEM source, or external reference has been analyzed in this build.</li>
            <li>Equipment identity, task details, frequency, and safety information are not independently verified.</li>
            <li>Any PM content in the next step must be written and reviewed by the planner.</li>
          </ul>
        </article>
      </div>
      <article className="mt-4 rounded-card border border-border bg-panel-muted p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><BookOpenCheck size={16} className="text-accent" aria-hidden="true" />Source record</div>
        <p className="mt-1 text-xs leading-5 text-muted">Describe where the planner-provided information came from. This build does not verify the source independently.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Reference label" htmlFor="evidence-title"><input id="evidence-title" disabled={readOnly} className={controlClass} value={evidence.title} onChange={(event) => updateSource("title", event.target.value)} placeholder="For example, operator inspection notes" /></Field>
          <Field label="Reference location" htmlFor="evidence-locator" hint="Name a page, section, note, or other location within the information supplied."><input id="evidence-locator" disabled={readOnly} className={controlClass} value={evidence.locator} onChange={(event) => updateSource("locator", event.target.value)} placeholder="Planner notes" /></Field>
          <Field label="Applicability to this equipment" htmlFor="evidence-applicability"><select id="evidence-applicability" disabled={readOnly} className={controlClass} value={evidence.applicability} onChange={(event) => updateSource("applicability", event.target.value as EvidenceApplicability)}><option value="unknown">Not established</option><option value="applicable">Applicable to this equipment</option><option value="different_variant">Different equipment variant</option><option value="not_applicable">Not applicable to this equipment</option></select></Field>
          <Field label="Applicability details" htmlFor="evidence-applicability-details"><input id="evidence-applicability-details" disabled={readOnly} className={controlClass} value={evidence.applicabilityDetails} onChange={(event) => updateSource("applicabilityDetails", event.target.value)} placeholder="Optional planner note" /></Field>
          <div className="md:col-span-2"><Field label="Additional limitations (one per line)" htmlFor="evidence-limitations"><textarea id="evidence-limitations" disabled={readOnly} rows={3} className={textAreaClass} value={extraLimitations.join("\n")} onChange={(event) => {
            const additions = event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).filter((item) => item !== PLANNER_EVIDENCE_BASE_LIMITATION);
            updateSource("limitations", [PLANNER_EVIDENCE_BASE_LIMITATION, ...new Set(additions)]);
          }} placeholder="Add limitations the planner identified" /></Field><p className="mt-2 text-xs text-muted">Planner-provided information is not independently verified.</p></div>
        </div>
        <p className="mt-3 text-xs text-muted">Current applicability: {applicabilityLabels[evidence.applicability]}</p>
        {evidence.reviewedAt && <p className="mt-2 text-xs text-muted">Last reviewed: {new Date(evidence.reviewedAt).toLocaleString()}</p>}
      </article>
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-card border border-border-input bg-panel-muted p-4 text-sm leading-6">
        <input type="checkbox" disabled={readOnly} checked={acknowledged} onChange={(event) => onAcknowledge(event.target.checked)} className="mt-1 h-4 w-4 accent-accent" />
        <span>I have reviewed these limitations and want to continue using only the planner-provided information.</span>
      </label>
      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-border pt-5">
        <ActionButton onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />Back to intake</ActionButton>
        <ActionButton type="button" variant="primary" onClick={onContinue} disabled={!acknowledged}>Continue to asset proposal <ArrowRight size={15} aria-hidden="true" /></ActionButton>
      </div>
    </section>
  );
}

function AssetsStep({ analysis, readOnly, onUpdate, onAdd, onRemove, parentAcknowledged, onParentAcknowledged, onBack, onContinue }: {
  analysis: PlannerAnalysis;
  readOnly: boolean;
  onUpdate: (id: string, changes: Partial<AssetProposal>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  parentAcknowledged: boolean;
  onParentAcknowledged: (checked: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const root = analysis.assets.find((asset) => asset.kind === "equipment");
  const children = analysis.assets.filter((asset) => asset.kind === "subasset");
  const hasConfirmedChildrenWithoutRoot = children.some((asset) => asset.confirmed) && !root?.confirmed;
  return (
    <section className="rounded-panel border border-border bg-panel p-5 shadow-card sm:p-7">
      <StepTitle eyebrow="03 · Asset proposal" title="Select the assets to keep" description="Only direct sub-assets are supported here. Each item needs an explicit planner decision." />
      {root && <AssetRow asset={root} root readOnly={readOnly} onUpdate={onUpdate} onRemove={onRemove} />}
      <div className="ml-4 mt-3 space-y-3 border-l border-border pl-4 sm:ml-7 sm:pl-6">
        {children.map((asset, index) => <AssetRow key={asset.id} asset={asset} index={index} readOnly={readOnly} onUpdate={onUpdate} onRemove={onRemove} />)}
        {!readOnly && <ActionButton type="button" onClick={onAdd}><Plus size={15} aria-hidden="true" />Add direct sub-asset</ActionButton>}
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-card border border-ring/30 bg-ring/5 p-4 text-sm leading-6 text-muted">
        <FolderTree size={17} className="mt-0.5 shrink-0 text-ring" aria-hidden="true" />
        <p>Confirm at least one asset before creating a PM. This prototype does not search for duplicates or create deeper hierarchy levels.</p>
      </div>
      {hasConfirmedChildrenWithoutRoot && <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-card border border-warning/40 bg-warning/5 p-4 text-sm leading-6 text-muted"><input type="checkbox" checked={parentAcknowledged} onChange={(event) => onParentAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 accent-accent" /><span>The selected sub-asset has no confirmed equipment parent. I reviewed this relationship and want to continue.</span></label>}
      {readOnly && <p className="mt-4 text-xs text-muted">Assets are locked because this analysis has an approved PM. Start a new analysis to create a separate proposal.</p>}
      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-border pt-5">
        <ActionButton onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />Back to evidence</ActionButton>
        <ActionButton type="button" variant="primary" onClick={onContinue}>{readOnly ? "Return to approved PM" : "Save assets and write PM"} <ArrowRight size={15} aria-hidden="true" /></ActionButton>
      </div>
    </section>
  );
}

function AssetRow({ asset, root = false, index, readOnly, onUpdate, onRemove }: { asset: AssetProposal; root?: boolean; index?: number; readOnly: boolean; onUpdate: (id: string, changes: Partial<AssetProposal>) => void; onRemove: (id: string) => void }) {
  const nameId = `asset-name-${asset.id}`;
  const sourceId = `asset-source-${asset.id}`;
  return (
    <article className={`rounded-card border p-4 ${root ? "border-ring/40 bg-panel-muted" : "border-border bg-panel-muted"}`}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-1 text-muted" aria-hidden="true">{root ? <Wrench size={17} /> : <FolderTree size={17} />}</span>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={root ? "Equipment asset" : `Direct sub-asset ${Number(index) + 1}`} htmlFor={nameId}>
            <input id={nameId} disabled={readOnly} value={asset.name} onChange={(event) => onUpdate(asset.id, { name: event.target.value })} className={controlClass} placeholder="Enter an asset name" />
          </Field>
          <Field label="Term from planner notes (optional)" htmlFor={sourceId}>
            <input id={sourceId} disabled={readOnly} value={asset.sourceTerm} onChange={(event) => onUpdate(asset.id, { sourceTerm: event.target.value })} className={controlClass} placeholder="Original term, if useful" />
          </Field>
        </div>
        {!root && <button type="button" disabled={readOnly} onClick={() => onRemove(asset.id)} aria-label={`Remove sub-asset ${asset.name || Number(index) + 1}`} className="rounded-control p-2 text-muted hover:bg-panel-raised hover:text-danger disabled:opacity-50"><Trash2 size={16} aria-hidden="true" /></button>}
      </div>
      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" disabled={readOnly} checked={asset.confirmed} onChange={(event) => onUpdate(asset.id, { confirmed: event.target.checked })} className="h-4 w-4 accent-accent" />
        <span>Confirm this {root ? "equipment asset" : "sub-asset"}</span>
      </label>
    </article>
  );
}

function PmStep({ analysis, pm, setPm, assets, reviewed, onReviewed, issues, catalog, onBack, onSave, onApprove, onCopy, onCopyStep }: {
  analysis: PlannerAnalysis;
  pm: PmDraft;
  setPm: (pm: PmDraft) => void;
  assets: AssetProposal[];
  reviewed: boolean;
  onReviewed: (checked: boolean) => void;
  issues: string[];
  catalog: CatalogLocation[];
  onBack: () => void;
  onSave: () => void;
  onApprove: () => void;
  onCopy: () => void;
  onCopyStep: (label: string, text: string) => void;
}) {
  const isApproved = pm.status === "approved";
  const unresolved = pm.operatingState === "undetermined" || !pm.safetyPrecautions.trim();
  const stepsCount = totalPmSteps(pm);
  function change<K extends keyof PmDraft>(key: K, value: PmDraft[K]) {
    setPm({ ...pm, [key]: value });
  }
  function changeTaskStep(index: number, value: string) {
    const taskSteps = [...pm.taskSteps];
    taskSteps[index] = value;
    change("taskSteps", taskSteps);
  }

  return (
    <section className="rounded-panel border border-border bg-panel p-5 shadow-card sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <StepTitle eyebrow="04 · PM editor" title="Write and review the maintenance plan" description="Enter PM content in English for CMMS handoff. This prototype does not translate, generate, or validate technical instructions." />
        <span className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium ${isApproved ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"}`}>
          {isApproved ? <CheckCircle2 size={14} aria-hidden="true" /> : <FileText size={14} aria-hidden="true" />}{isApproved ? "Approved" : "Draft"}
        </span>
      </div>

      {isApproved && <div className="mb-5 flex items-start gap-3 rounded-card border border-success/40 bg-success/5 p-4 text-sm leading-6 text-muted"><FileCheck2 size={17} className="mt-0.5 shrink-0 text-success" aria-hidden="true" /><p>This saved version was approved {backendMode ? "in this workspace" : "in this browser"} on {pm.approvedAt ? new Date(pm.approvedAt).toLocaleString() : "an earlier session"}. It has not been sent to a CMMS.</p></div>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="space-y-5 xl:col-span-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="PM title" htmlFor="pm-title"><input id="pm-title" disabled={isApproved} className={controlClass} value={pm.title} onChange={(event) => change("title", event.target.value)} placeholder="Planner-authored title" /></Field>
            <Field label="Asset" htmlFor="pm-asset"><select id="pm-asset" disabled={isApproved} className={controlClass} value={pm.assetId} onChange={(event) => change("assetId", event.target.value)}><option value="">Select a confirmed asset</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name || "Unnamed asset"}</option>)}</select></Field>
            <Field label="Frequency" htmlFor="pm-frequency" hint="Use a planner-provided interval or state that it is not established."><input id="pm-frequency" disabled={isApproved} className={controlClass} value={pm.frequency} onChange={(event) => change("frequency", event.target.value)} placeholder="For example, Not established" /></Field>
            <Field label="Estimated duration (minutes)" htmlFor="pm-duration"><input id="pm-duration" type="number" min="1" disabled={isApproved} className={controlClass} value={pm.durationMinutes} onChange={(event) => change("durationMinutes", event.target.value)} placeholder="Minutes" /></Field>
          </div>

          <div className="rounded-card border border-border bg-panel-muted p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><BookOpenCheck size={16} className="text-accent" aria-hidden="true" />Evidence reference</div>
            {analysis.plannerEvidence?.reviewedAt ? <>
              <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-6">
                <input type="checkbox" disabled={isApproved} checked={pm.evidenceSourceIds.includes(analysis.plannerEvidence.id)} onChange={(event) => change("evidenceSourceIds", event.target.checked ? [...new Set([...pm.evidenceSourceIds, analysis.plannerEvidence!.id])] : pm.evidenceSourceIds.filter((id) => id !== analysis.plannerEvidence!.id))} className="mt-1 h-4 w-4 accent-accent" />
                <span>Include the reviewed planner-provided source in this PM.</span>
              </label>
              <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div><dt className="text-muted">Reference</dt><dd className="mt-1 font-medium">{analysis.plannerEvidence.title || "Planner-provided information"}</dd></div>
                <div><dt className="text-muted">Location</dt><dd className="mt-1">{analysis.plannerEvidence.locator || "Planner notes"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted">Applicability</dt><dd className="mt-1">{{ applicable: "Applicable to this equipment", different_variant: "Different equipment variant", unknown: "Not established", not_applicable: "Not applicable to this equipment" }[analysis.plannerEvidence.applicability]}</dd></div>
              </dl>
              {analysis.plannerEvidence.limitations.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted">{analysis.plannerEvidence.limitations.map((item) => <li key={item}>{item}</li>)}</ul>}
              {analysis.plannerEvidence.applicability !== "applicable" && <p className="mt-3 rounded-control border border-warning/40 bg-warning/5 p-3 text-xs leading-5 text-muted">Applicability has not been confirmed for this equipment. Keep that uncertainty visible and review any PM content manually.</p>}
            </> : <p className="mt-2 text-sm leading-6 text-muted">Review and save a source record before attaching it to the PM.</p>}
          </div>

          <div className="rounded-card border border-border bg-panel-muted p-4">
            <h3 className="text-sm font-semibold">Opening statement and safety information</h3>
            <p className="mt-1 text-xs leading-5 text-muted">These fields form the first PM step. Enter only details you can support; this prototype does not determine operating state or LOTO requirements.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Operating state" htmlFor="operating-state"><select id="operating-state" disabled={isApproved} className={controlClass} value={pm.operatingState} onChange={(event) => change("operatingState", event.target.value as OperatingState)}><option value="running">Running</option><option value="stopped">Stopped</option><option value="undetermined">Not determined</option></select></Field>
              <Field label="Safety precautions / LOTO details" htmlFor="safety-precautions" hint="If the information is unknown, leave blank and acknowledge that it remains unresolved."><input id="safety-precautions" disabled={isApproved} className={controlClass} value={pm.safetyPrecautions} onChange={(event) => change("safetyPrecautions", event.target.value)} placeholder="Planner-provided precaution" /></Field>
            </div>
            {unresolved && <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-control border border-warning/40 bg-warning/5 p-3 text-sm leading-5 text-muted"><input type="checkbox" disabled={isApproved} checked={pm.unresolvedSafetyAcknowledged} onChange={(event) => change("unresolvedSafetyAcknowledged", event.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" /><span>Operating state or safety information remains unresolved. Keep that limitation visible and require planner review before approval.</span></label>}
          </div>

          <div className="rounded-card border border-border bg-panel-muted p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="text-sm font-semibold">Task steps</h3><p className="mt-1 text-xs text-muted">Opening statement and final verification count toward the {MAX_PM_STEPS}-step limit.</p></div>
              <span className={`rounded-pill border px-2.5 py-1 text-xs font-medium ${stepsCount >= MAX_PM_STEPS ? "border-warning/40 bg-warning/10 text-warning" : "border-border-input bg-panel-raised text-muted"}`}>{stepsCount} / {MAX_PM_STEPS}</span>
            </div>
            <ol className="mt-4 space-y-3" aria-label="PM procedure steps">
              <ProcedureRow number={1} label="Opening statement" text={openingPmStep(pm)} onCopy={() => onCopyStep("1", openingPmStep(pm))} />
              {pm.taskSteps.map((task, index) => <li key={`task-${index}`} className="flex items-start gap-2 rounded-control border border-border bg-panel p-2.5">
                <span className="mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-pill border border-border-input text-xs font-medium text-muted">{index + 2}</span>
                <label htmlFor={`task-step-${index}`} className="sr-only">Task step {index + 1}</label>
                <textarea id={`task-step-${index}`} disabled={isApproved} rows={2} className="min-h-10 min-w-0 flex-1 resize-y bg-transparent px-1 py-1 text-sm leading-5 text-foreground placeholder:text-muted" value={task} onChange={(event) => changeTaskStep(index, event.target.value)} placeholder="Enter a planner-authored task step" />
                <button type="button" aria-label={`Copy task step ${index + 1}`} onClick={() => onCopyStep(String(index + 2), task)} className="rounded-control p-2 text-muted hover:bg-panel-raised hover:text-foreground"><Clipboard size={15} aria-hidden="true" /></button>
                <button type="button" disabled={isApproved} aria-label={`Remove task step ${index + 1}`} onClick={() => change("taskSteps", pm.taskSteps.filter((_, current) => current !== index))} className="rounded-control p-2 text-muted hover:bg-panel-raised hover:text-danger disabled:opacity-50"><Trash2 size={15} aria-hidden="true" /></button>
              </li>)}
              <ProcedureRow number={pm.taskSteps.length + 2} label="Final verification" text={pm.finalVerification.trim() || "Not provided"} onCopy={() => onCopyStep(String(pm.taskSteps.length + 2), `Verify and record: ${pm.finalVerification}`)} />
            </ol>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <ActionButton type="button" disabled={isApproved || stepsCount >= MAX_PM_STEPS} onClick={() => change("taskSteps", [...pm.taskSteps, ""])}><Plus size={15} aria-hidden="true" />Add task step</ActionButton>
              <span className="text-xs text-muted">Up to {MAX_PM_STEPS - 2} task steps</span>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <Field label="Final verification content" htmlFor="final-verification"><textarea id="final-verification" disabled={isApproved} rows={2} className={textAreaClass} value={pm.finalVerification} onChange={(event) => change("finalVerification", event.target.value)} placeholder="Describe what the planner should verify and record at the end…" /></Field>
            </div>
          </div>

          {!isApproved && <label className="flex cursor-pointer items-start gap-3 rounded-card border border-border-input bg-panel-muted p-4 text-sm leading-6"><input type="checkbox" checked={reviewed} onChange={(event) => onReviewed(event.target.checked)} className="mt-1 h-4 w-4 accent-accent" /><span>I reviewed this planner-authored PM, including the asset, frequency, duration, operating state, safety details, task steps, and any unresolved limitations.</span></label>}
          {issues.length > 0 && <div role="alert" className="rounded-card border border-warning/40 bg-warning/5 p-4"><p className="text-sm font-semibold text-warning">Approval needs attention</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div>}
          {isApproved && pm.approvedAt && <p className="text-xs text-muted">Approved on {new Date(pm.approvedAt).toLocaleDateString()} · Initial approved version</p>}
        </div>

        <aside className="space-y-4 xl:col-span-2">
          <div className="rounded-card border border-border bg-panel-muted p-4 xl:sticky xl:top-24">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">CMMS handoff preview</p><h3 className="mt-1 text-sm font-semibold">{pm.title.trim() || "Untitled PM"}</h3></div>
              <span className={`shrink-0 rounded-pill border px-2.5 py-1 text-xs font-medium ${isApproved ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"}`}>{isApproved ? "Approved" : "Draft"}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">Planner-entered · no translation · {stepsCount} of {MAX_PM_STEPS} steps · Copy only</p>
            <div role="region" aria-label="PM handoff preview" tabIndex={0} className="mt-4 max-h-96 overflow-y-auto rounded-control border border-border bg-panel p-3">
              <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-5 text-foreground">{renderPmText(analysis, pm, catalog)}</pre>
            </div>
            <ActionButton type="button" onClick={onCopy} className="mt-4 w-full"><ClipboardCheck size={15} aria-hidden="true" />Copy entire PM</ActionButton>
            {unresolved && <div className="mt-4 flex items-start gap-2 rounded-control border border-warning/40 bg-warning/5 p-3 text-xs leading-5 text-muted"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" /><p>Unresolved state or safety information remains visible in the copied content.</p></div>}
          </div>
        </aside>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-border pt-5">
        <ActionButton type="button" onClick={onBack} disabled={isApproved}><ArrowLeft size={15} aria-hidden="true" />Back to assets</ActionButton>
        <div className="flex flex-wrap gap-2">
          {!isApproved && <ActionButton type="button" onClick={onSave}><Save size={15} aria-hidden="true" />Save draft</ActionButton>}
          {!isApproved && <ActionButton type="button" variant="primary" onClick={onApprove}><CheckCircle2 size={15} aria-hidden="true" />Approve PM</ActionButton>}
          {isApproved && <ActionButton type="button" onClick={onCopy}><ClipboardCheck size={15} aria-hidden="true" />Copy approved PM</ActionButton>}
        </div>
      </div>
    </section>
  );
}

function ProcedureRow({ number, label, text, onCopy }: { number: number; label: string; text: string; onCopy: () => void }) {
  return <li className="flex items-start gap-2 rounded-control border border-border bg-panel p-2.5">
    <span className="mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-pill border border-border-input text-xs font-medium text-muted">{number}</span>
    <div className="min-w-0 flex-1 py-1"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 break-words text-sm leading-5 text-foreground">{text}</p></div>
    <button type="button" aria-label={`Copy ${label.toLowerCase()}`} onClick={onCopy} className="rounded-control p-2 text-muted hover:bg-panel-raised hover:text-foreground"><Clipboard size={15} aria-hidden="true" /></button>
  </li>;
}

function StepTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-6"><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{eyebrow}</p><h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p></div>;
}

export default PlannerWorkspace;
