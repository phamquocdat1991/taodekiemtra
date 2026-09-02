import React, { useState, useEffect, useRef } from "react";
import {
  FullExamState,
  MatrixData,
  SpecificationData,
  ExamData,
  AnswerData,
  DetailGuideData,
  WorkflowStep,
} from "./types";
import { defaultPresets } from "./data/defaultTemplates";
import {
  generateMatrixAI,
  generateSpecificationAI,
  generateExamAI,
  generateAnswersAI,
  generateDetailGuideAI,
  getCustomApiKey,
} from "./services/geminiService";
import {
  generateMatrixDocxBlob,
  generateSpecDocxBlob,
  generateExamDocxBlob,
  generateAnswersDocxBlob,
  generateDetailGuideDocxBlob,
  downloadBlob,
  exportAllFilesZip,
} from "./services/wordExportService";

// UI Components
import { Header } from "./components/Header";
import { GeneralConfigCard } from "./components/GeneralConfigCard";
import { KnowledgeCard } from "./components/KnowledgeCard";
import { StructureCard } from "./components/StructureCard";
import { StickyActionBar } from "./components/StickyActionBar";
import { WorkflowStepper } from "./components/WorkflowStepper";
import { StepToolbar } from "./components/StepToolbar";
import { MatrixStepView } from "./components/MatrixStepView";
import { SpecStepView } from "./components/SpecStepView";
import { ExamStepView } from "./components/ExamStepView";
import { AnswerStepView } from "./components/AnswerStepView";
import { DetailStepView } from "./components/DetailStepView";
import { SummaryStepView } from "./components/SummaryStepView";

// Phase 2: Online Exam Room
import { ExamRoomCard } from "./components/ExamRoomCard";
import { StudentPortal } from "./components/StudentPortal";
import { OnlineExamRoom } from "./components/OnlineExamRoom";
import { ClassroomDashboard } from "./components/ClassroomDashboard";
import { createRoom, getRoom } from "./services/roomService";
import { OnlineRoom } from "./types";

// Modals
import { ApiKeyModal } from "./components/ApiKeyModal";
import { GuideModal } from "./components/GuideModal";
import { ConfigPresetsModal } from "./components/ConfigPresetsModal";
import { EditModal } from "./components/EditModal";

export function App() {
  // Main State
  const [viewMode, setViewMode] = useState<"config" | "workflow" | "student" | "exam">("config");
  const [config, setConfig] = useState<FullExamState>(defaultPresets[0].state);

  // Phase 2: Online Room State
  const [activeRoom, setActiveRoom] = useState<OnlineRoom | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [examRoom, setExamRoom] = useState<OnlineRoom | null>(null);

  // URL PIN auto-detection
  const urlPin = new URLSearchParams(window.location.search).get("pin") || "";

  // 5 Step Artifacts
  const [matrix, setMatrix] = useState<MatrixData | null>(null);
  const [spec, setSpec] = useState<SpecificationData | null>(null);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<AnswerData | null>(null);
  const [detail, setDetail] = useState<DetailGuideData | null>(null);

  // Workflow Navigation State
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Auto-Mode State
  const [autoMode, setAutoMode] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const autoTimerRef = useRef<any>(null);

  // Modal States
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    setHasCustomKey(Boolean(getCustomApiKey()));
    // If URL has ?pin=XXXXXX, auto-go to student portal
    if (urlPin && urlPin.length === 6) {
      setViewMode("student");
    }
  }, []);

  // Validation
  const totalCognition =
    Number(config.cognition.nb || 0) +
    Number(config.cognition.th || 0) +
    Number(config.cognition.vd || 0) +
    Number(config.cognition.vdc || 0);

  const isConfigValid = totalCognition === 100;

  // Handle subject change & auto presets
  const handleSubjectChange = (newSubject: string) => {
    const matchedPreset = defaultPresets.find(
      (p) =>
        p.state.general.subject.toLowerCase() === newSubject.toLowerCase() ||
        (newSubject.toLowerCase().includes("tiếng anh") && p.id === "preset-english-10") ||
        (newSubject.toLowerCase().includes("văn") && p.id === "preset-lit-10")
    );

    if (matchedPreset) {
      setConfig((prev) => ({
        ...prev,
        structure: matchedPreset.state.structure,
        knowledge: {
          ...prev.knowledge,
          content: matchedPreset.state.knowledge.content,
        },
      }));
    }
  };

  // Typed Step Generators
  const generateStep1 = async (cfg = config): Promise<MatrixData | null> => {
    setIsGenerating(true);
    try {
      const m = await generateMatrixAI(cfg);
      setMatrix(m);
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
      return m;
    } catch (err) {
      console.error("Error generating step 1:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStep2 = async (cfg = config, m = matrix): Promise<SpecificationData | null> => {
    if (!m) return null;
    setIsGenerating(true);
    try {
      const s = await generateSpecificationAI(cfg, m);
      setSpec(s);
      setCompletedSteps((prev) => (prev.includes(2) ? prev : [...prev, 2]));
      return s;
    } catch (err) {
      console.error("Error generating step 2:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStep3 = async (
    cfg = config,
    m = matrix,
    s = spec
  ): Promise<ExamData | null> => {
    if (!m || !s) return null;
    setIsGenerating(true);
    try {
      const e = await generateExamAI(cfg, m, s);
      setExam(e);
      setCompletedSteps((prev) => (prev.includes(3) ? prev : [...prev, 3]));
      return e;
    } catch (err) {
      console.error("Error generating step 3:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStep4 = async (cfg = config, e = exam): Promise<AnswerData | null> => {
    if (!e) return null;
    setIsGenerating(true);
    try {
      const a = await generateAnswersAI(cfg, e);
      setAnswers(a);
      setCompletedSteps((prev) => (prev.includes(4) ? prev : [...prev, 4]));
      return a;
    } catch (err) {
      console.error("Error generating step 4:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStep5 = async (
    cfg = config,
    e = exam,
    a = answers
  ): Promise<DetailGuideData | null> => {
    if (!e || !a) return null;
    setIsGenerating(true);
    try {
      const d = await generateDetailGuideAI(cfg, e, a);
      setDetail(d);
      setCompletedSteps((prev) => (prev.includes(5) ? prev : [...prev, 5]));
      return d;
    } catch (err) {
      console.error("Error generating step 5:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Phase 2 & 3: Create Online Room Handler
  const handleCreateRoom = async () => {
    if (!exam || !answers) return;
    const pin = await createRoom(config, exam, answers);
    const room = await getRoom(pin);
    if (room) {
      setActiveRoom(room);
      setIsRoomModalOpen(true);
    }
  };

  // Phase 2: Go to Student Portal
  const handleGoToStudentPortal = () => {
    setViewMode("student");
  };

  // Phase 2: Start exam from student portal
  const handleStartExam = (room: OnlineRoom, name: string) => {
    setExamRoom(room);
    setStudentName(name);
    setViewMode("exam");
  };

  // Start Manual Workflow
  const handleStartManual = async () => {
    setViewMode("workflow");
    setAutoMode(false);
    setCurrentStep(1);
    await generateStep1(config);
  };

  // Start Auto Workflow
  const handleStartAuto = async () => {
    setViewMode("workflow");
    setAutoMode(true);
    setAutoPaused(false);
    setCurrentStep(1);
    const m = await generateStep1(config);
    if (m) {
      startAutoCountdown(2, config, m, null, null, null);
    }
  };

  // Auto Countdown Engine
  const startAutoCountdown = (
    nextStep: WorkflowStep,
    cfg: FullExamState,
    m: MatrixData | null,
    s: SpecificationData | null,
    e: ExamData | null,
    a: AnswerData | null
  ) => {
    if (nextStep > 6) {
      setAutoMode(false);
      setCurrentStep(6);
      return;
    }

    setAutoCountdown(5);
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);

    let count = 5;
    autoTimerRef.current = setInterval(async () => {
      if (autoPaused) return;

      count -= 1;
      setAutoCountdown(count);

      if (count <= 0) {
        clearInterval(autoTimerRef.current);
        setAutoCountdown(null);
        setCurrentStep(nextStep);

        if (nextStep === 2) {
          const resSpec = await generateStep2(cfg, m);
          if (resSpec) startAutoCountdown(3, cfg, m, resSpec, null, null);
        } else if (nextStep === 3) {
          const resExam = await generateStep3(cfg, m, s);
          if (resExam) startAutoCountdown(4, cfg, m, s, resExam, null);
        } else if (nextStep === 4) {
          const resAns = await generateStep4(cfg, e);
          if (resAns) startAutoCountdown(5, cfg, m, s, e, resAns);
        } else if (nextStep === 5) {
          const resDet = await generateStep5(cfg, e, a);
          if (resDet) {
            setCompletedSteps((prev) => (prev.includes(6) ? prev : [...prev, 6]));
            setCurrentStep(6);
            setAutoMode(false);
          }
        } else if (nextStep === 6) {
          setCompletedSteps((prev) => (prev.includes(6) ? prev : [...prev, 6]));
          setAutoMode(false);
        }
      }
    }, 1000);
  };

  const handlePauseAuto = () => {
    setAutoPaused(true);
  };

  const handleResumeAuto = () => {
    setAutoPaused(false);
  };

  const handleSkipAuto = async () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    setAutoCountdown(null);
    const next = ((currentStep % 6) + 1) as WorkflowStep;
    setCurrentStep(next);

    if (next === 2 && !spec && matrix) {
      const res = await generateStep2(config, matrix);
      if (res) startAutoCountdown(3, config, matrix, res, exam, answers);
    } else if (next === 3 && !exam && matrix && spec) {
      const res = await generateStep3(config, matrix, spec);
      if (res) startAutoCountdown(4, config, matrix, spec, res, answers);
    } else if (next === 4 && !answers && exam) {
      const res = await generateStep4(config, exam);
      if (res) startAutoCountdown(5, config, matrix, spec, exam, res);
    } else if (next === 5 && !detail && exam && answers) {
      const res = await generateStep5(config, exam, answers);
      if (res) {
        setCompletedSteps((prev) => (prev.includes(6) ? prev : [...prev, 6]));
        setCurrentStep(6);
        setAutoMode(false);
      }
    } else if (next === 6) {
      setCompletedSteps((prev) => (prev.includes(6) ? prev : [...prev, 6]));
      setAutoMode(false);
    }
  };

  const handleCancelAuto = () => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    setAutoCountdown(null);
    setAutoMode(false);
    setAutoPaused(false);
  };

  // Manual Step Forward
  const handleContinue = async () => {
    const next = (currentStep + 1) as WorkflowStep;
    if (next > 6) return;
    setCurrentStep(next);

    if (next === 2 && !spec && matrix) {
      await generateStep2(config, matrix);
    } else if (next === 3 && !exam && matrix && spec) {
      await generateStep3(config, matrix, spec);
    } else if (next === 4 && !answers && exam) {
      await generateStep4(config, exam);
    } else if (next === 5 && !detail && exam && answers) {
      await generateStep5(config, exam, answers);
    } else if (next === 6) {
      setCompletedSteps((prev) => (prev.includes(6) ? prev : [...prev, 6]));
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setViewMode("config");
      handleCancelAuto();
    } else {
      setCurrentStep((prev) => (prev - 1) as WorkflowStep);
    }
  };

  const handleRegenerateCurrent = async () => {
    if (currentStep === 1) {
      await generateStep1(config);
    } else if (currentStep === 2) {
      await generateStep2(config, matrix);
    } else if (currentStep === 3) {
      await generateStep3(config, matrix, spec);
    } else if (currentStep === 4) {
      await generateStep4(config, exam);
    } else if (currentStep === 5) {
      await generateStep5(config, exam, answers);
    }
  };

  // Copy to Clipboard
  const handleCopy = () => {
    let textToCopy = "";
    if (currentStep === 1 && matrix) {
      textToCopy = `${matrix.title || "MA TRẬN ĐỀ KIỂM TRA"}\n` + matrix.rows.map((r) => `${r.stt}. ${r.topic} - ${r.knowledgeUnit} (NB: ${r.nb}, TH: ${r.th}, VD: ${r.vd}, VDC: ${r.vdc} | ${r.totalPoints}đ)`).join("\n");
    } else if (currentStep === 2 && spec) {
      textToCopy = `${spec.title || "BẢN ĐẶC TẢ ĐỀ KIỂM TRA"}\n` + spec.rows.map((r) => `${r.questionNumber}: ${r.topic} - ${r.knowledgeUnit} | Mức độ: ${r.level} | ${r.points}đ\n${r.objective}`).join("\n\n");
    } else if (currentStep === 3 && exam) {
      textToCopy = `${exam.header.examTitle}\nMôn: ${exam.header.subject} - ${exam.header.grade}\n\n` + exam.parts.map((p) => `${p.partTitle}\n` + p.questions.map((q) => `Câu ${q.questionNumber}: ${q.content} (${q.points}đ)` + (q.options ? "\n" + q.options.map((o) => `${o.key}. ${o.text}`).join("    ") : "")).join("\n\n")).join("\n\n");
    } else if (currentStep === 4 && answers) {
      textToCopy = `${answers.title}\n\n` + answers.parts.map((p) => `${p.partTitle}\n` + p.items.map((i) => `${i.questionNumber}: ${i.solutionSummary} (${i.points}đ)`).join("\n")).join("\n\n");
    } else if (currentStep === 5 && detail) {
      textToCopy = `${detail.title}\n\n` + detail.items.map((i) => `${i.questionNumber}: ${i.questionExcerpt}\nĐáp án: ${i.answer}\nLời giải: ${i.detailedSolution}\nKiến thức: ${i.knowledgeUsed}`).join("\n\n");
    } else if (currentStep === 6) {
      textToCopy = `BỘ ĐỀ KIỂM TRA MÔN ${config.general.subject} - ${config.general.grade} (${config.general.duration} phút)`;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  // Export Word Individual
  const handleExportSingleDocx = async (step: WorkflowStep) => {
    const baseName = `De_Kiem_Tra_${config.general.subject}_${config.general.grade.replace(/\s+/g, "_")}`;

    if (step === 1 && matrix) {
      const blob = await generateMatrixDocxBlob(config, matrix);
      downloadBlob(blob, `1_PhuLuc1_MaTran_${baseName}.docx`);
    } else if (step === 2 && spec) {
      const blob = await generateSpecDocxBlob(config, spec);
      downloadBlob(blob, `2_PhuLuc2_DacTa_${baseName}.docx`);
    } else if (step === 3 && exam) {
      const blob = await generateExamDocxBlob(config, exam);
      downloadBlob(blob, `3_DeThi_${baseName}.docx`);
    } else if (step === 4 && answers) {
      const blob = await generateAnswersDocxBlob(config, answers);
      downloadBlob(blob, `4_DapAn_${baseName}.docx`);
    } else if (step === 5 && detail) {
      const blob = await generateDetailGuideDocxBlob(config, detail);
      downloadBlob(blob, `5_HuongDanGiai_${baseName}.docx`);
    } else if (step === 6) {
      await exportAllFilesZip(config, matrix, spec, exam, answers, detail);
    }
  };

  const handleExportAllZip = async () => {
    await exportAllFilesZip(config, matrix, spec, exam, answers, detail);
  };

  // Reset Session
  const handleResetSession = () => {
    if (window.confirm("Thầy/Cô có chắc chắn muốn làm mới toàn bộ cấu hình và dữ liệu đã tạo?")) {
      setConfig(defaultPresets[0].state);
      setMatrix(null);
      setSpec(null);
      setExam(null);
      setAnswers(null);
      setDetail(null);
      setCompletedSteps([]);
      setCurrentStep(1);
      setViewMode("config");
      handleCancelAuto();
    }
  };

  // Inline edit saving
  const handleSaveInlineEdit = (step: WorkflowStep, updatedData: any) => {
    if (step === 1) setMatrix(updatedData);
    if (step === 2) setSpec(updatedData);
    if (step === 3) setExam(updatedData);
    if (step === 4) setAnswers(updatedData);
    if (step === 5) setDetail(updatedData);
  };

  const getCurrentStepData = () => {
    if (currentStep === 1) return matrix;
    if (currentStep === 2) return spec;
    if (currentStep === 3) return exam;
    if (currentStep === 4) return answers;
    if (currentStep === 5) return detail;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]/80 text-stone-800 font-sans antialiased pb-28">

      {/* Phase 2: Student Portal View */}
      {viewMode === "student" && (
        <StudentPortal
          initialPin={urlPin}
          onBack={() => setViewMode("config")}
          onStartExam={(room, name) => handleStartExam(room, name)}
        />
      )}

      {/* Phase 2: Online Exam View */}
      {viewMode === "exam" && examRoom && (
        <OnlineExamRoom
          room={examRoom}
          studentName={studentName}
          onFinish={() => setViewMode("student")}
        />
      )}

      {/* Main Teacher App */}
      {(viewMode === "config" || viewMode === "workflow") && (
        <div className="max-w-[1020px] mx-auto pt-4 md:pt-6 px-3 sm:px-4">
        <Header
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          onOpenGuideModal={() => setIsGuideModalOpen(true)}
          onResetSession={handleResetSession}
          hasCustomKey={hasCustomKey}
          onGoToStudentPortal={handleGoToStudentPortal}
        />

        {/* 1. CONFIGURATION VIEW */}
        {viewMode === "config" && (
          <div className="animate-in fade-in duration-300">
            <GeneralConfigCard
              general={config.general}
              cognition={config.cognition}
              onGeneralChange={(updated) =>
                setConfig((prev) => ({
                  ...prev,
                  general: { ...prev.general, ...updated },
                }))
              }
              onCognitionChange={(updated) =>
                setConfig((prev) => ({
                  ...prev,
                  cognition: { ...prev.cognition, ...updated },
                }))
              }
              onSubjectChange={handleSubjectChange}
            />

            <KnowledgeCard
              knowledge={config.knowledge}
              onChange={(updated) =>
                setConfig((prev) => ({
                  ...prev,
                  knowledge: { ...prev.knowledge, ...updated },
                }))
              }
            />

            <StructureCard
              subject={config.general.subject}
              structure={config.structure}
              onChange={(updated) =>
                setConfig((prev) => ({
                  ...prev,
                  structure: { ...prev.structure, ...updated },
                }))
              }
            />

            {/* Bottom Sticky Action Bar */}
            <StickyActionBar
              isValid={isConfigValid}
              onOpenPresets={() => setIsPresetsModalOpen(true)}
              onStartAuto={handleStartAuto}
              onStartManual={handleStartManual}
            />
          </div>
        )}

        {/* 2. WORKFLOW 6-STEP VIEW */}
        {viewMode === "workflow" && (
          <div className="animate-in fade-in duration-300">
            {/* Stepper + Auto Mode Banner */}
            <WorkflowStepper
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={(step) => {
                handleCancelAuto();
                setCurrentStep(step);
              }}
              autoMode={autoMode}
              autoCountdown={autoCountdown}
              autoPaused={autoPaused}
              isGenerating={isGenerating}
              onPauseAuto={handlePauseAuto}
              onResumeAuto={handleResumeAuto}
              onSkipAuto={handleSkipAuto}
              onCancelAuto={handleCancelAuto}
            />

            {/* Step Toolbar */}
            <StepToolbar
              currentStep={currentStep}
              isGenerating={isGenerating}
              onBack={handleBack}
              onRegenerateCurrentStep={handleRegenerateCurrent}
              onContinue={handleContinue}
              onEdit={() => setIsEditModalOpen(true)}
              onCopy={handleCopy}
              onExportWord={() => handleExportSingleDocx(currentStep)}
              hasCopied={hasCopied}
            />

            {/* Step Views */}
            {currentStep === 1 && (
              <MatrixStepView config={config} matrix={matrix} />
            )}
            {currentStep === 2 && (
              <SpecStepView config={config} spec={spec} />
            )}
            {currentStep === 3 && (
              <ExamStepView config={config} exam={exam} />
            )}
            {currentStep === 4 && (
              <AnswerStepView config={config} answers={answers} />
            )}
            {currentStep === 5 && (
              <DetailStepView config={config} detail={detail} />
            )}
            {currentStep === 6 && (
              <SummaryStepView
                config={config}
                matrix={matrix}
                spec={spec}
                exam={exam}
                answers={answers}
                detail={detail}
                onExportAllZip={handleExportAllZip}
                onExportSingleDocx={handleExportSingleDocx}
                onCreateRoom={handleCreateRoom}
                onNewExam={() => {
                  setViewMode("config");
                  handleCancelAuto();
                }}
                onJumpToStep={(step) => {
                  handleCancelAuto();
                  setCurrentStep(step);
                }}
              />
            )}
          </div>
        )}
      </div>
      )} {/* End teacher wrapper div */}

      {/* Phase 2: Exam Room Modal */}
      {isRoomModalOpen && activeRoom && (
        <ExamRoomCard
          room={activeRoom}
          onClose={() => {
            setIsRoomModalOpen(false);
            setActiveRoom(null);
          }}
          onOpenDashboard={() => setIsDashboardOpen(true)}
        />
      )}

      {/* Phase 3: Classroom Dashboard Modal */}
      {isDashboardOpen && activeRoom && (
        <ClassroomDashboard
          pin={activeRoom.pin}
          onClose={() => setIsDashboardOpen(false)}
        />
      )}

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(hasKey) => setHasCustomKey(hasKey)}
      />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <ConfigPresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        currentState={config}
        onApplyPreset={(newConfig) => {
          setConfig(newConfig);
          setMatrix(null);
          setSpec(null);
          setExam(null);
          setAnswers(null);
          setDetail(null);
          setCompletedSteps([]);
        }}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        step={currentStep}
        data={getCurrentStepData()}
        onSave={handleSaveInlineEdit}
      />
    </div>
  );
}
export default App;
