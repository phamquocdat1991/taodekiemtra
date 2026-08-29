import React, { useState, useEffect } from "react";
import { FullExamState } from "../types";
import { defaultPresets } from "../data/defaultTemplates";
import {
  FolderHeart,
  X,
  Plus,
  Save,
  Trash2,
  Check,
  Bookmark,
  Sparkles,
} from "lucide-react";

interface ConfigPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: FullExamState;
  onApplyPreset: (state: FullExamState) => void;
}

interface SavedPreset {
  id: string;
  name: string;
  date: string;
  state: FullExamState;
}

const LOCAL_STORAGE_KEY = "exam_generator_saved_presets";

export const ConfigPresetsModal: React.FC<ConfigPresetsModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onApplyPreset,
}) => {
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [activeTab, setActiveTab] = useState<"system" | "custom">("system");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedPresets(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Cannot load presets from localStorage", e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      date: new Date().toLocaleDateString("vi-VN"),
      state: currentState,
    };
    const updated = [newPreset, ...savedPresets];
    setSavedPresets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Cannot save preset", e);
    }
    setNewPresetName("");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const handleDeletePreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Cannot delete preset", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-xl border border-[#EFE7DF] relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#EFE7DF]">
          <div className="w-11 h-11 rounded-xl bg-orange-100 text-[#F5730B] flex items-center justify-center font-bold">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg md:text-xl text-[#431805]">
              Quản Lý Cấu Hình Khảo Thí
            </h3>
            <p className="text-xs text-stone-500">
              Lưu và áp dụng nhanh mẫu cấu hình ma trận theo môn học
            </p>
          </div>
        </div>

        {/* Save current config form */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFE7DF] mb-6">
          <label className="block text-xs font-bold text-[#8F310C] uppercase tracking-wider mb-2">
            Lưu cấu hình hiện tại làm mẫu riêng của Thầy/Cô:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder={`VD: Mẫu Đề ${currentState.general.subject} ${currentState.general.grade} ${currentState.general.examType}`}
              className="flex-1 px-3.5 py-2 rounded-xl border border-[#EFE7DF] bg-white text-xs md:text-sm font-medium text-[#431805] outline-none focus:border-[#F5730B]"
            />
            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={!newPresetName.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F5730B] hover:bg-[#d96408] text-white disabled:opacity-50 transition-all shrink-0 cursor-pointer active:scale-95"
            >
              {justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{justSaved ? "Đã lưu!" : "Lưu mẫu"}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-[#EFE7DF] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("system")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "system"
                ? "bg-[#431805] text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Mẫu chuẩn GDPT 2018 ({defaultPresets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "custom"
                ? "bg-[#431805] text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            Mẫu của Thầy/Cô ({savedPresets.length})
          </button>
        </div>

        {/* Preset list */}
        <div className="space-y-3">
          {activeTab === "system" &&
            defaultPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-4 rounded-xl border border-[#EFE7DF] hover:border-orange-300 bg-white hover:bg-orange-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#431805] text-sm">
                      {preset.name}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-stone-700 border border-[#EFE7DF]">
                      {preset.state.general.grade}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                    {preset.state.knowledge.content}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset(preset.state);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-100 hover:text-[#F5730B] border border-[#EFE7DF] transition-all shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F5730B]" />
                  <span>Áp dụng mẫu</span>
                </button>
              </div>
            ))}

          {activeTab === "custom" &&
            (savedPresets.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-400">
                Thầy/Cô chưa lưu cấu hình nào. Hãy nhập tên và nhấn "Lưu mẫu" ở trên!
              </div>
            ) : (
              savedPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl border border-[#EFE7DF] hover:border-orange-300 bg-white hover:bg-orange-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-[#F5730B]" />
                      <span className="font-bold text-[#431805] text-sm">
                        {preset.name}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        ({preset.date})
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Môn {preset.state.general.subject} – {preset.state.general.grade} – {preset.state.general.examType}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onApplyPreset(preset.state);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#8F310C] hover:bg-orange-100 border border-[#EFE7DF] transition-all cursor-pointer"
                    >
                      Áp dụng
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa mẫu này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ))}
        </div>
      </div>
    </div>
  );
};
