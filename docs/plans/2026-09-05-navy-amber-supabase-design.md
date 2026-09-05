# Thiết kế Navy–Amber và backend Supabase

Ngày duyệt: 2026-09-05

## Quyết định đã được duyệt

- Giao diện: Navy–Amber.
- Backend: Supabase riêng cho ứng dụng.
- Xác thực giáo viên: email và mật khẩu.
- Học sinh: không cần tài khoản, vào phòng bằng PIN và họ tên.
- Supabase project: `taodekiemtra`, Singapore (`ap-southeast-1`).
- Frontend tiếp tục triển khai trên Vercel project `taodekiemtra`.

## Mục tiêu

1. Nâng cấp giao diện thành một không gian khảo thí chuyên nghiệp, rõ cấp bậc và dễ dùng trên desktop/mobile.
2. Giữ nguyên quy trình nghiệp vụ sáu bước: cấu hình, ma trận, đặc tả, đề thi, đáp án, hướng dẫn giải/tổng kết.
3. Biến đăng nhập, Gemini và phòng thi thành chức năng production thật; không dùng dữ liệu mẫu âm thầm.
4. Khóa các lỗi logic bằng kiểm thử tự động: tổng nhận thức, tổng điểm, số câu, ánh xạ đề–đáp án và quyền truy cập dữ liệu.
5. Bảo toàn chức năng xuất từng tệp Word và ZIP, đồng thời sửa dữ liệu và bố cục xuất.

## Ngoài phạm vi

- Không thêm ngân hàng câu hỏi, thanh toán, lớp học, thông báo hay vai trò quản trị mới.
- Không tự nhận sản phẩm “tuân thủ 100%” một văn bản/quy định nếu chưa có kiểm định độc lập.
- Không lưu khóa Gemini của giáo viên trong cơ sở dữ liệu.

## Kiến trúc giao diện

### Desktop

- Header 64 px: thương hiệu bên trái; trợ giúp, API key, tài khoản và đăng xuất bên phải.
- Cột trái 240 px: tiến trình sáu bước, trạng thái hoàn thành/lỗi/đang xử lý.
- Cột giữa: các biểu mẫu và nội dung bước hiện tại.
- Cột phải 300 px: tóm tắt cấu hình, tổng số câu, điểm, tỷ lệ và danh sách lỗi có liên kết tới trường sai.
- Hành động chính dùng màu amber; navy/cobalt cho điều hướng; xanh lá chỉ biểu thị hợp lệ/thành công; đỏ chỉ biểu thị lỗi.

### Mobile và tablet

- Điều hướng bước chuyển thành thanh tiến trình ngang có thể cuộn.
- Tóm tắt cấu hình chuyển thành bảng thu gọn.
- Các trường và thẻ xếp một cột; vùng chạm tối thiểu 44 px.
- Thanh hành động cố định dưới cùng, không che nội dung và tôn trọng safe-area.

### Khả năng tiếp cận

- Mỗi input/select có `label`, `id`, thông báo lỗi và mô tả liên kết bằng `aria-describedby`.
- Thứ tự tab theo luồng đọc; modal giữ focus và trả focus về nút mở.
- Tương phản đạt WCAG AA; không truyền đạt trạng thái chỉ bằng màu.
- Toàn bộ chuỗi tiếng Việt hiển thị đầy đủ dấu.

## Luồng xác thực

- Giáo viên đăng ký/đăng nhập bằng email và mật khẩu qua Supabase Auth.
- Phiên được khôi phục khi tải lại và được hủy bằng `signOut` thật.
- Quên mật khẩu dùng email đặt lại mật khẩu của Supabase.
- Trang cấu hình và dashboard yêu cầu giáo viên đã xác thực; trang học sinh theo PIN vẫn công khai.

## Mô hình dữ liệu

### `exam_rooms`

- Thuộc sở hữu của `teacher_id = auth.uid()`.
- Lưu PIN duy nhất, trạng thái `draft/open/closed/expired`, thời điểm mở/hết hạn, cấu hình, đề và đáp án dưới dạng JSONB.
- Chỉ giáo viên sở hữu được đọc/cập nhật/xóa trực tiếp qua RLS.
- Có chỉ mục theo `(teacher_id, created_at)` và PIN đang mở.

### `exam_attempts`

- Thuộc một phòng thi; lưu họ tên học sinh, token truy cập đã băm, thời điểm bắt đầu/nộp, câu trả lời và kết quả.
- Học sinh không truy cập bảng trực tiếp. Edge Function tạo attempt và xử lý nộp bài.
- Giáo viên sở hữu phòng được xem kết quả qua RLS.
- Có ràng buộc idempotency để không tạo/nộp trùng do retry.

## Edge Functions

### `generate-content`

- Chỉ nhận yêu cầu có JWT giáo viên hợp lệ.
- Nhận cấu hình đã chuẩn hóa và khóa Gemini từ phiên hiện tại; không ghi khóa vào log hay database.
- Gọi Gemini, phân tích JSON và trả lỗi có cấu trúc nếu dữ liệu không đạt schema.
- Không tự rơi về mock. UI giải thích rõ lỗi và cho phép thử lại.

### `room-api`

- Hành động giáo viên yêu cầu JWT và kiểm tra quyền sở hữu phòng.
- Hành động `join` công khai nhận PIN + tên, trả đề đã loại toàn bộ đáp án và một attempt token dùng một lần.
- Hành động `submit` kiểm tra token, thời hạn, trạng thái phòng và tính idempotent; chấm điểm phía máy chủ.
- Không bao giờ trả answer key trong payload vào phòng.

## Tính nhất quán nội dung

- Cấu hình hợp lệ chỉ khi tổng nhận thức = 100%, tổng tỷ lệ cấu trúc = 100%, tổng điểm = 10 và số câu không âm.
- Mỗi câu có `id` duy nhất trên toàn đề; mọi đáp án/lời giải tham chiếu bằng `questionId`, không dùng số câu có thể trùng giữa các phần.
- Sau mỗi bước AI, bộ kiểm tra đối chiếu subject, grade, số câu, điểm và ánh xạ với bước trước.
- Nếu AI trả dữ liệu sai, ứng dụng báo lỗi cụ thể; không thay số tổng kết bằng hằng số để che sai lệch.
- Khi đổi môn, nội dung kiến thức và yêu cầu bổ sung chỉ được thay bằng preset tương ứng nếu người dùng chưa tự chỉnh; không để yêu cầu môn cũ đi sang môn mới.

## Phòng thi và chấm điểm

- Giáo viên tạo phòng ở trạng thái mở; học sinh thiết bị khác tham gia bằng PIN.
- Attempt token ngẫu nhiên chỉ lưu bản băm trong database.
- Đồng hồ thi dùng `expires_at` từ máy chủ, không chỉ đếm cục bộ.
- Nộp bài được chấm ở Edge Function; retry trả lại cùng kết quả, không tạo bản ghi trùng.
- Dashboard giáo viên nhận cập nhật Realtime của các bài đã nộp.
- Câu khách quan được chấm xác định theo `questionId` tại Edge Function.
- Với câu tự luận/viết, AI chỉ tạo điểm gợi ý và nhận xét dựa trên rubric; kết quả chuyển sang trạng thái `pending_teacher_review`.
- Giáo viên bắt buộc duyệt hoặc sửa từng điểm tự luận trước khi công bố; điểm AI không tự động trở thành điểm chính thức.
- Trước khi công bố, học sinh chỉ thấy điểm khách quan tạm tính và trạng thái “Đang chờ giáo viên chấm phần tự luận”.
- Sau khi giáo viên xác nhận, hệ thống tính lại tổng điểm và lưu dấu thời gian/người duyệt.

## Xuất Word/ZIP

- Dữ liệu xuất lấy trực tiếp từ artifact đã qua validation.
- Header cơ quan/trường chia dòng và căn bảng đúng khổ A4.
- Bảng ma trận đặt chiều rộng cột có chủ ý, tránh bẻ từng chữ.
- Tổng hàng và tổng kết phải được tính lại từ dữ liệu, không dùng giá trị cố định.

## Xử lý lỗi

- Lỗi cấu hình nằm cạnh trường sai và trong bảng tóm tắt.
- Lỗi AI phân biệt: thiếu key, key không hợp lệ, giới hạn, mạng và dữ liệu phản hồi không hợp lệ.
- Lỗi phòng thi phân biệt: PIN không tồn tại, hết hạn, đã đóng, đã nộp hoặc mất kết nối.
- Không dùng thông báo chung chung “server có thể không hoạt động” khi đã biết mã lỗi.

## Kiểm thử chấp nhận

- Giáo viên đăng ký, đăng nhập, quên mật khẩu và đăng xuất thật.
- Tạo đề cho ít nhất Toán THPT, KHTN THCS, Ngữ văn và Tiếng Anh; mọi artifact đồng nhất cấu hình.
- Chặn tạo đề khi nhận thức/tỷ lệ/điểm sai.
- Hai phiên trình duyệt khác nhau tạo phòng, vào phòng, làm bài, nộp và nhận kết quả; dashboard cập nhật.
- Học sinh không thể tải đáp án trước khi nộp.
- Word và ZIP mở được, không tràn/cắt và tổng điểm đúng.
- Kiểm tra desktop, tablet, mobile; bàn phím; nhãn truy cập; console và network không có lỗi ngoài dự kiến.
