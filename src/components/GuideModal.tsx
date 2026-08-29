import React from "react";
import { BookOpen, X, CheckCircle, ShieldCheck, Sparkles, FileText, ArrowRight } from "lucide-react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

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
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg md:text-xl text-[#431805]">
              Hướng Dẫn Sử Dụng Web App “TẠO ĐỀ KIỂM TRA”
            </h3>
            <p className="text-xs text-stone-500">
              Quy trình chuẩn hóa đề kiểm tra định kỳ theo Chương trình GDPT 2018
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-stone-700 leading-relaxed font-medium">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFE7DF]">
            <h4 className="font-bold text-[#8F310C] text-sm flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#F5730B] text-white flex items-center justify-center text-xs font-bold">1</span>
              Thiết lập cấu hình chung & Mức độ nhận thức
            </h4>
            <p className="text-xs text-stone-600">
              Chọn Cấp học, Lớp, Môn học, Bộ sách và Thời gian làm bài. Nhập tỷ lệ mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) sao cho tổng tỷ lệ bằng đúng <strong>100%</strong>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFE7DF]">
            <h4 className="font-bold text-[#8F310C] text-sm flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#F5730B] text-white flex items-center justify-center text-xs font-bold">2</span>
              Nội dung kiến thức & Cấu trúc điểm
            </h4>
            <p className="text-xs text-stone-600">
              Nhập tên các bài học hoặc tải lên tệp tài liệu (.pdf, .docx, .txt). Hệ thống tự động nhận diện cấu hình đặc thù cho các môn: <strong>Ngoại ngữ (Listening, Language, Reading, Writing)</strong>, <strong>Ngữ văn (Đọc hiểu 6đ / Làm văn 4đ)</strong> hoặc <strong>Môn chung (Trắc nghiệm, Đúng/Sai, Điền khuyết, Tự luận)</strong>.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFE7DF]">
            <h4 className="font-bold text-[#8F310C] text-sm flex items-center gap-2 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#F5730B] text-white flex items-center justify-center text-xs font-bold">3</span>
              Quy trình 6 bước khảo thí chuẩn mực
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-[#EFE7DF] font-bold text-stone-800">
                1. Khung Ma Trận
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#EFE7DF] font-bold text-stone-800">
                2. Bản Đặc Tả
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#EFE7DF] font-bold text-stone-800">
                3. Đề Thi Học Sinh
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#EFE7DF] font-bold text-stone-800">
                4. Đáp Án & Biểu Điểm
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#EFE7DF] font-bold text-stone-800">
                5. Hướng Dẫn Sư Phạm
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#EFE7DF] font-bold text-stone-800">
                6. Tổng Hợp & Xuất Zip
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <h4 className="font-bold text-emerald-800 text-sm flex items-center gap-2 mb-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Xuất tệp Word (.docx) chuẩn thể thức Bộ GD&ĐT
            </h4>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Các tệp Word được xuất định dạng A4, căn lề chuẩn, bảng biểu có viền kẻ chỉn chu, kiểu chữ Times New Roman và tiêu đề Quốc hiệu chuẩn quốc gia sẵn sàng in ấn trực tiếp hoặc lưu trữ khảo thí.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#EFE7DF] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-[#F5730B] hover:bg-[#d96408] text-white transition-all shadow-sm cursor-pointer active:scale-95"
          >
            Đã hiểu, bắt đầu tạo đề
          </button>
        </div>
      </div>
    </div>
  );
};
