import type { DefaultPresetItem } from "../data/defaultTemplates.ts";
import type {
  FullExamState,
  QuestionStructureState,
} from "../types.ts";

const normalized = (value: string) => value.trim().toLocaleLowerCase("vi");

function findPreset(subject: string, presets: DefaultPresetItem[]) {
  const target = normalized(subject);

  return presets.find((preset) => {
    const presetSubject = normalized(preset.state.general.subject);

    return (
      presetSubject === target ||
      (target.includes("tiếng anh") && preset.id === "preset-english-10") ||
      ((target.includes("ngữ văn") || target.includes("tiếng việt")) &&
        preset.id === "preset-lit-10") ||
      (target.includes("khoa học tự nhiên") && preset.id === "preset-khtn-8")
    );
  });
}

function cloneStructure(structure: QuestionStructureState): QuestionStructureState {
  return {
    type: structure.type,
    standard: {
      multipleChoice: { ...structure.standard.multipleChoice },
      trueFalse: { ...structure.standard.trueFalse },
      shortAnswer: { ...structure.standard.shortAnswer },
      essay: { ...structure.standard.essay },
    },
    language: {
      listening: { ...structure.language.listening },
      languageFocus: { ...structure.language.languageFocus },
      reading: { ...structure.language.reading },
      writing: { ...structure.language.writing },
    },
    literature: {
      preset: structure.literature.preset,
      readingComprehension: { ...structure.literature.readingComprehension },
      writingComposition: { ...structure.literature.writingComposition },
    },
  };
}

export function applySubjectPreset(
  config: FullExamState,
  subject: string,
  presets: DefaultPresetItem[],
): FullExamState {
  const preset = findPreset(subject, presets);
  if (!preset) {
    return {
      ...config,
      general: { ...config.general, subject },
    };
  }

  const knownRequirements = new Set(
    presets.map((item) => item.state.knowledge.additionalRequirements.trim()),
  );
  const currentRequirements = config.knowledge.additionalRequirements.trim();
  const shouldUsePresetRequirements =
    currentRequirements.length === 0 || knownRequirements.has(currentRequirements);

  return {
    ...config,
    general: { ...config.general, subject },
    knowledge: {
      ...config.knowledge,
      content: preset.state.knowledge.content,
      additionalRequirements: shouldUsePresetRequirements
        ? preset.state.knowledge.additionalRequirements
        : config.knowledge.additionalRequirements,
    },
    structure: cloneStructure(preset.state.structure),
  };
}

