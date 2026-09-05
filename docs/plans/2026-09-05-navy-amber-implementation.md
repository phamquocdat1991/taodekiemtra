# Kế hoạch triển khai Navy–Amber

> Thực hiện theo TDD: viết test thất bại, xác nhận lý do thất bại, sửa tối thiểu để test qua, rồi refactor.

**Mục tiêu:** Nâng cấp UI Navy–Amber, sửa logic tạo đề/xuất file và thay backend Express-memory bằng Supabase Auth, Postgres, Realtime và Edge Functions.

**Kiến trúc:** Vite/React tiếp tục chạy trên Vercel. Frontend dùng publishable key của Supabase. Giáo viên thao tác dữ liệu có RLS; học sinh chỉ gọi Edge Function bằng PIN và attempt token. Gemini chạy qua Edge Function có xác thực giáo viên.

**Công nghệ:** React 19, TypeScript, Tailwind CSS 4, Supabase JS/Auth/Postgres/Realtime/Edge Functions, Node test runner qua `tsx`, `docx`, JSZip.

## 1. Tạo nền kiểm thử và validation thuần

**Tệp:**
- Sửa `package.json`.
- Tạo `src/lib/examValidation.ts`.
- Tạo `src/lib/subjectPresets.ts`.
- Tạo `tests/examValidation.test.ts`.
- Tạo `tests/subjectPresets.test.ts`.

**Các bước:**
1. Thêm lệnh test bằng `tsx --test`.
2. Viết test cho tổng nhận thức, tổng tỷ lệ, tổng điểm và số câu âm.
3. Viết test tái hiện cấu trúc 99% vẫn được coi là hợp lệ.
4. Viết test đổi môn không giữ yêu cầu bổ sung của môn cũ.
5. Viết implementation thuần và chạy test + typecheck.

## 2. Chuẩn hóa ID và kiểm tra artifact AI

**Tệp:**
- Sửa `src/types.ts`.
- Tạo `src/lib/artifactValidation.ts`.
- Tạo `tests/artifactValidation.test.ts`.
- Sửa `src/services/geminiService.ts`.
- Sửa `src/services/mockDataGenerator.ts`.

**Các bước:**
1. Viết fixture tái hiện đề KHTN nhưng nội dung/header Toán, tổng hàng 7 nhưng summary 10, câu trùng số và đáp án sai ID.
2. Thêm validator cho header, tổng câu/điểm và ánh xạ `questionId`.
3. Loại fallback mock âm thầm khỏi luồng production.
4. Trả lỗi có cấu trúc để UI hiển thị và cho thử lại.
5. Chạy toàn bộ test + typecheck.

## 3. Tạo schema Supabase an toàn

**Tệp:**
- Tạo `supabase/migrations/202609050001_exam_rooms.sql`.
- Tạo `supabase/migrations/202609050002_exam_attempts.sql`.
- Tạo `supabase/migrations/202609050003_realtime.sql`.
- Tạo `tests/sql/schema_contract.test.ts` hoặc kiểm tra contract tương đương.

**Các bước:**
1. Viết schema với khóa chính, check constraint, timestamptz và JSONB.
2. Thêm index cho foreign key, ownership, PIN đang mở và dashboard.
3. Bật RLS trên mọi bảng public; policy dùng `(select auth.uid())` và ownership predicate.
4. Cấp quyền tối thiểu; không để anon đọc đề/đáp án trực tiếp.
5. Chạy migration trên project mới, chạy advisors và truy vấn xác minh.

## 4. Edge Functions Gemini và phòng thi

**Tệp:**
- Tạo `supabase/functions/_shared/cors.ts`.
- Tạo `supabase/functions/_shared/http.ts`.
- Tạo `supabase/functions/_shared/grading.ts`.
- Tạo `supabase/functions/generate-content/index.ts`.
- Tạo `supabase/functions/room-api/index.ts`.
- Tạo `tests/grading.test.ts`.

**Các bước:**
1. Viết test chấm điểm dùng question ID duy nhất và retry idempotent.
2. Viết `generate-content` yêu cầu JWT giáo viên, không log/lưu Gemini key.
3. Viết `room-api` cho create/join/submit/results/close.
4. Đảm bảo join response đã loại đáp án và token lưu dạng hash.
5. Với tự luận, lưu điểm AI gợi ý theo rubric ở trạng thái chờ duyệt; thêm hành động giáo viên duyệt/sửa và công bố.
6. Deploy functions và kiểm thử HTTP thành công/thất bại.

## 5. Tích hợp Supabase Auth và service frontend

**Tệp:**
- Sửa `.env.example`.
- Tạo `src/lib/supabase.ts`.
- Tạo `src/contexts/AuthContext.tsx`.
- Tạo `src/components/AuthScreen.tsx`.
- Tạo `src/components/ResetPasswordScreen.tsx`.
- Sửa `src/main.tsx` và `src/App.tsx`.
- Sửa `src/services/geminiService.ts` và `src/services/roomService.ts`.

**Các bước:**
1. Cài/pin `@supabase/supabase-js` và commit lockfile.
2. Thêm login, đăng ký, quên/đặt lại mật khẩu và phục hồi phiên.
3. Bảo vệ màn hình giáo viên nhưng giữ `?pin=` công khai.
4. Thay reset giả bằng `supabase.auth.signOut()`.
5. Thay mọi `/api/*` cũ bằng Supabase Functions/Data API/Realtime.

## 6. Xây shell Navy–Amber và accessibility

**Tệp:**
- Sửa `src/index.css`.
- Sửa `src/App.tsx`.
- Sửa `src/components/Header.tsx`.
- Sửa `src/components/WorkflowStepper.tsx`.
- Sửa `src/components/StickyActionBar.tsx`.
- Tạo `src/components/ConfigurationSummary.tsx`.
- Sửa `src/components/GeneralConfigCard.tsx`, `KnowledgeCard.tsx`, `StructureCard.tsx`.

**Các bước:**
1. Thêm token màu, shadow, focus ring và kích thước chữ Navy–Amber.
2. Dựng grid trái–giữa–phải desktop và responsive mobile.
3. Kết nối validator chung với summary và trạng thái disabled.
4. Thêm label/id/aria/error cho form và focus management cho modal.
5. Kiểm tra bàn phím và contrast.

## 7. Chuẩn hóa UI phòng thi và dashboard

**Tệp:**
- Sửa `src/components/ExamRoomCard.tsx`.
- Sửa `src/components/StudentPortal.tsx`.
- Sửa `src/components/OnlineExamRoom.tsx`.
- Sửa `src/components/ClassroomDashboard.tsx`.

**Các bước:**
1. Thay toàn bộ chuỗi không dấu bằng tiếng Việt chuẩn.
2. Dùng question ID thay cho số câu làm key.
3. Đồng bộ đồng hồ theo `expires_at` máy chủ.
4. Kết nối submit thật và Realtime dashboard; xóa localStorage fallback.
5. Kiểm thử hai phiên trình duyệt độc lập.

## 8. Sửa xuất Word/ZIP

**Tệp:**
- Sửa `src/services/wordExportService.ts`.
- Tạo `tests/exportCalculations.test.ts`.

**Các bước:**
1. Viết test tổng ma trận/đặc tả/đề/đáp án trước khi render.
2. Tính mọi tổng từ hàng nguồn, không ghi đè bằng 10/100.
3. Sửa header và độ rộng bảng A4.
4. Sinh đủ năm DOCX + ZIP; kiểm tra integrity và render từng tệp đại diện.

## 9. Kiểm thử hồi quy và triển khai

**Tệp:**
- Sửa `README.md` nếu cần hướng dẫn vận hành.
- Cập nhật cấu hình Vercel/Supabase cần thiết.

**Các bước:**
1. Chạy test, typecheck và production build sạch.
2. Chạy browser QA desktop/mobile cho giáo viên và học sinh.
3. Kiểm tra auth, RLS, dữ liệu không rò đáp án, Realtime và lỗi network.
4. Tạo nhánh GitHub/PR, triển khai preview Vercel và kiểm thử preview.
5. Chỉ promote production sau khi preview đạt toàn bộ tiêu chí.
