# TÀI LIỆU DIỄN GIẢI CHI TIẾT CÁC LUỒNG HOẠT ĐỘNG CỦA HỆ THỐNG IOT
*(Viết dưới dạng lời văn thuyết minh chi tiết phục vụ báo cáo, thuyết trình và tìm hiểu hệ thống)*

---

## 🌟 GIỚI THIỆU TỔNG QUAN VỀ HỆ THỐNG

Hệ thống được thiết kế theo mô hình **IoT End-to-End** hoàn chỉnh, bao gồm 4 tầng kiến trúc chính phối hợp nhịp nhàng với nhau:

1. **Tầng Thiết Bị Vật Lý (Hardware - ESP32 Lolin C3 Mini):** 
   - Vi điều khiển lõi RISC-V tích hợp Wi-Fi.
   - Kết nối 2 module cảm biến môi trường qua bus I2C: Cảm biến nhiệt độ & độ ẩm **AHT20** và cảm biến cường độ ánh sáng **BH1750** (Chân giao tiếp `SDA = GPIO 8`, `SCL = GPIO 9`).
   - Kết nối 3 đèn LED chỉ báo/chấp hành đại diện cho 3 thiết bị điều khiển vật lý: Đèn Nhiệt độ (`LED_1 = GPIO 0`), Đèn Độ ẩm (`LED_2 = GPIO 1`), Đèn Ánh sáng (`LED_3 = GPIO 20`).
2. **Tầng Giao Tiếp Trung Gian (MQTT Broker - HiveMQ):** 
   - Đóng vai trò làm trung tâm điều phối tin nhắn theo mô hình Publish/Subscribe (Xuất bản/Đăng ký) tốc độ cao, độ trễ thấp giữa Phần cứng và Máy chủ Web.
3. **Tầng Xử Lý Trung Tâm (Backend - Node.js / Express / MySQL / WebSocket):** 
   - Tiếp nhận dữ liệu cảm biến, lưu trữ an toàn vào cơ sở dữ liệu MySQL.
   - Nhận lệnh điều khiển từ người dùng, chuyển đổi và phát lệnh qua MQTT xuống phần cứng.
   - Duy trì kênh truyền thời gian thực **WebSocket** để đẩy dữ liệu lập tức tới trình duyệt người dùng.
4. **Tầng Giao Diện Người Dùng (Frontend - React / TypeScript / Vite / TailwindCSS / Chart.js):** 
   - Bảng điều khiển (Dashboard) trực quan hiển thị số đo môi trường, đồ thị sóng động thời gian thực, các công tắc bật/tắt thiết bị tức thời.
   - Các màn hình quản lý, tra cứu lịch sử đo cảm biến, lịch sử thao tác thiết bị và quản lý hồ sơ người dùng.

---

## 🔘 LUỒNG 1: QUY TRÌNH ĐIỀU KHIỂN BẬT / TẮT THIẾT BỊ (LED) TỪ WEB

Đây là luồng điều khiển khép kín hai chiều (Closed-loop Control). Khi người dùng nhấn nút trên trình duyệt, tín hiệu điều khiển sẽ đi qua hệ thống máy chủ, truyền qua Internet xuống mạch ESP32 để kích hoạt chân điện áp vật lý, đồng thời mạch ESP32 sẽ phản hồi lại xác nhận để cập nhật đồng bộ lên giao diện Web.

```
[Người dùng click Web] ──> [API Backend] ──> [MySQL Log] ──> [MQTT Broker] 
                                                                    │
                                                                    ▼
[Giao diện Web đồng bộ] <── [WebSocket] <── [MQTT Nhận phản hồi] <── [ESP32 Kích chân LED & Phản hồi]
```

### Diễn giải chi tiết từng bước theo lời văn:

* **Bước 1 – Người dùng thao tác trên giao diện Web:**
  Tại trang Dashboard (`Phan_mem/FE/src/components/dashboard/DeviceControl.tsx`), người dùng nhìn thấy các thẻ thiết bị (Ví dụ: "Đèn Cảnh Báo Nhiệt Độ"). Khi người dùng bấm gạt công tắc từ trạng thái **TẮT (OFF)** sang **BẬT (ON)**, sự kiện `handleToggle()` trong component React được kích hoạt. Giao diện lập tức gọi tới hàm dịch vụ `sendDeviceCommand()` trong file `Phan_mem/FE/src/services/deviceService.ts` với thông số bao gồm mã thiết bị (ví dụ `D001`) và hành động cần thực hiện (`{ action: "TURN_ON" }`).

* **Bước 2 – Đóng gói và gửi yêu cầu qua giao thức HTTP:**
  Hàm dịch vụ sử dụng module `api.ts` để gắn kèm mã xác thực người dùng (`Authorization: Bearer <token>`) vào tiêu đề HTTP, sau đó phát một yêu cầu `POST /api/devices/D001/command` lên máy chủ Backend. Nhờ cấu hình Proxy trong file `vite.config.ts`, yêu cầu từ cổng phát triển của Frontend (`5500`) được tự động chuyển hướng an toàn sang cổng làm việc của Backend (`5000`).

* **Bước 3 – Backend tiếp nhận và xử lý nghiệp vụ:**
  Yêu cầu đi vào hệ thống định tuyến `Phan_mem/BE/routes/devices.js`, vượt qua lớp bảo vệ `authMiddleware.js` để kiểm tra quyền truy cập và được chuyển tới hàm xử lý `sendCommand()` trong file `Phan_mem/BE/controllers/deviceController.js`.
  Tại đây, Backend thực hiện chuỗi 3 hành động logic:
  1. Truy vấn bảng `Devices` trong CSDL MySQL để tìm mã định danh MQTT tương ứng (`mqtt_key` là `LED1`, `LED2` hoặc `LED3`).
  2. Ghi nhận trạng thái mới vào CSDL (`UPDATE Devices SET status = 1 WHERE device_id = 1`).
  3. Ghi một bản ghi nhật ký kiểm toán vào bảng `ActionHistory` (Lưu lại ai đã thao tác, bật hay tắt, lúc mấy giờ).

* **Bước 4 – Xuất bản lệnh điều khiển qua mạng MQTT:**
  Ngay sau khi cập nhật CSDL, Controller gọi tới module truyền thông `Phan_mem/BE/services/mqttHandler.js`. Hàm `publishDeviceCommand()` tạo một gói tin định dạng JSON: `{"LED1": "ON"}` và gửi (Publish) lên Topic quản lý `Device_control/thh` trên máy chủ MQTT Broker (`broker.hivemq.com`).

* **Bước 5 – ESP32 tiếp nhận lệnh và tác động phần cứng:**
  Kit vi điều khiển ESP32 Lolin C3 Mini (đang chạy chương trình `Phan_cung/src/main.cpp`) liên tục duy trì kết nối Wi-Fi và đăng ký lắng nghe Topic `Device_control/thh`. Khi nhận được gói tin, hàm ngắt `callback()` được gọi:
  1. Thư viện `ArduinoJson` tiến hành bóc tách gói tin và đọc giá trị của khóa `LED1`.
  2. Phát hiện giá trị là `"ON"`, ESP32 chuyển chế độ của đèn sang điều khiển thủ công (`led1_auto = false`) và thực hiện câu lệnh vi điều khiển: `digitalWrite(LED_1, HIGH)`.
  3. Mức điện áp tại chân **GPIO 0** lập tức chuyển từ 0V lên 3.3V, dòng điện chạy qua bóng đèn LED 1 và **đèn vật lý phát sáng ngay lập tức**.

* **Bước 6 – ESP32 gửi phản hồi xác nhận trạng thái thực tế:**
  Để đảm bảo tính tin cậy tuyệt đối (tránh việc trên Web báo bật nhưng dây LED bị đứt hoặc mất điện), hàm `publishDeviceRespond()` trong `main.cpp` đọc lại trạng thái thực tế của các chân GPIO và gửi một thông điệp xác nhận dạng JSON `{"LED1": "ON", "LED2": "OFF", "LED3": "OFF"}` lên Topic `Device_respond/thh`.

* **Bước 7 – Backend nhận phản hồi và phát sóng thời gian thực qua WebSocket:**
  Module `mqttHandler.js` của Backend nhận được tin nhắn từ Topic `Device_respond/thh`. Nó kiểm tra, đồng bộ lại trạng thái cuối cùng vào MySQL và lập tức gọi hàm `broadcast()` để phát gói tin sự kiện `device_status` qua đường truyền **WebSocket** tới tất cả các trình duyệt đang mở.

* **Bước 8 – Giao diện Web cập nhật trạng thái mượt mà:**
  Tại Frontend, Custom Hook `useRealtimeData.ts` (kết nối qua `mqttService.ts`) bắt được sự kiện WebSocket, cập nhật trạng thái của thẻ thiết bị trong React State. Nút gạt trên màn hình chuyển sang màu xanh (Bật) mà người dùng không cần phải tải lại trang.

---

## 📈 LUỒNG 2: THU THẬP VÀ GIÁM SÁT DỮ LIỆU CẢM BIẾN REALTIME

Đây là luồng dữ liệu tự động theo chu kỳ (Periodic Ingestion Stream) từ môi trường vật lý lên biểu đồ và cơ sở dữ liệu trung tâm.

```
[AHT20 & BH1750] ──(I2C)──> [ESP32 đọc mỗi 3s] ──(MQTT: Sensor/thh)──> [MQTT Broker]
                                                                              │
                                                                              ▼
[Biểu đồ & Thẻ đo Web] <──(WebSocket)── [Backend Server] <───────────────────┘
                                                │
                                                ▼ (SQL INSERT)
                                       [MySQL: DataSensor]
```

### Diễn giải chi tiết từng bước theo lời văn:

* **Bước 1 – Đo lường môi trường qua cảm biến phần cứng:**
  Cặp cảm biến môi trường gồm **AHT20** (đo nhiệt độ phòng và độ ẩm không khí) và **BH1750** (đo cường độ ánh sáng theo đơn vị Lux) liên tục cảm biến các thay đổi vật lý của môi trường thực tế xung quanh mạch.

* **Bước 2 – ESP32 đọc dữ liệu qua giao tiếp bus I2C:**
  Trong file `Phan_cung/src/main.cpp`, tại hàm vòng lặp vô tận `loop()`, một bộ đếm thời gian phi khóa (`millis() - lastRead >= 3000`) được thiết lập. Cứ sau mỗi **3 giây**:
  - ESP32 kích hoạt giao tiếp I2C trên 2 chân tín hiệu `SDA_PIN (GPIO 8)` và `SCL_PIN (GPIO 9)`.
  - Gọi lệnh `aht.getEvent(&humidity, &temp)` để lấy giá trị Nhiệt độ (°C) và Độ ẩm (%).
  - Gọi lệnh `lightMeter.readLightLevel()` để lấy giá trị Cường độ sáng (Lux).
  - *(Cơ chế chịu lỗi)*: Nếu việc đọc cảm biến AHT20 thất bại (do lỏng dây hoặc nhiễu nguồn), hàm sẽ tự động khởi động lại kênh I2C (`aht.begin(&Wire)`) để thử phục hồi lập tức.

* **Bước 3 – Xử lý tự động tại biên (Edge Computing / Auto Mode):**
  Trước khi gửi dữ liệu đi, ESP32 gọi hàm `checkAndControlSensors()`. Nếu các thiết bị đang ở chế độ tự động (`AUTO`), ESP32 sẽ tự so sánh dữ liệu với các ngưỡng an toàn để tự bật/tắt đèn bảo vệ:
  - Nếu Nhiệt độ > 35.5°C $\rightarrow$ Tự động bật Đèn 1 (Cảnh báo nóng); khi Nhiệt độ < 34.5°C $\rightarrow$ Tự động tắt Đèn 1 (có dải trễ 1°C tránh chập chờn).
  - Nếu Độ ẩm > 31.0% $\rightarrow$ Tự động bật Đèn 2.
  - Nếu Ánh sáng < 95 Lux $\rightarrow$ Tự động bật Đèn 3 (Trời tối cần bổ sung ánh sáng).

* **Bước 4 – Đóng gói JSON và gửi lên Broker:**
  ESP32 sử dụng `ArduinoJson` làm tròn số liệu 1 chữ số thập phân, tạo chuỗi JSON:
  `{"temperature": 29.4, "humidity": 68.2, "light": 450.0}`
  Sau đó xuất bản chuỗi này lên Topic `Sensor/thh` qua kết nối Wi-Fi.

* **Bước 5 – Backend tiếp nhận và bóc tách dữ liệu:**
  Dịch vụ `Phan_mem/BE/services/mqttHandler.js` đang chờ sẵn trên Topic `Sensor/thh` sẽ kích hoạt hàm `handleSensorData(data)`. Nó bóc tách 3 thông số độc lập: nhiệt độ, độ ẩm và ánh sáng.

* **Bước 6 – Lưu trữ đồng thời vào Cơ sở dữ liệu MySQL:**
  Backend ánh xạ các trường dữ liệu với bảng danh mục `Sensor` để lấy `sensor_id`, sau đó thực thi 3 câu lệnh SQL `INSERT INTO DataSensor (sensor_id, value, recorded_at)` để ghi lại giá trị đo đạc cùng dấu thời gian chính xác tới từng giây.

* **Bước 7 – Phát sóng thời gian thực qua WebSocket:**
  Đồng thời với việc lưu database, Backend gọi hàm `broadcast('sensor_data', ...)` để đẩy ngay gói dữ liệu cảm biến tới tất cả các phiên làm việc của người dùng đang truy cập hệ thống.

* **Bước 8 – Render số liệu và vẽ chuyển động đồ thị trên React:**
  - **Custom Hook:** `Phan_mem/FE/src/hooks/useRealtimeData.ts` nhận được thông điệp WebSocket, lập tức cập nhật biến trạng thái `currentValues` và đẩy điểm dữ liệu mới vào mảng lịch sử `chartData` (duy trì tối đa 30 điểm gần nhất).
  - **SensorCard.tsx:** Các ô hiển thị số to thay đổi tức thì, tự động đổi màu sắc cảnh báo (ví dụ nhiệt độ cao chuyển sang viền đỏ cam).
  - **SensorChart.tsx:** Thư viện đồ thị **Chart.js** tự động cuộn sóng đồ thị sang bên trái và vẽ điểm dữ liệu mới mượt mà, giúp người dùng theo dõi biến thiên môi trường từng giây mà không cần thao tác F5.

---

## 🔍 LUỒNG 3: TRA CỨU & LỌC LỊCH SỬ THAO TÁC THIẾT BỊ (ACTION HISTORY)

Đây là luồng truy vấn dữ liệu có cấu trúc (Query & Pagination Flow) phục vụ nhu cầu kiểm toán hành vi người dùng trong hệ thống nhà thông minh.

```
[Người dùng chọn Bộ lọc & Bấm Tìm kiếm] ──> [ActionFilter.tsx] ──> [ActionHistory.tsx]
                                                                          │
                                                                          ▼ (HTTP GET /api/actions)
[Hiển thị Bảng & Phân trang] <── (JSON Response) <── [MySQL JOIN] <── [actionController.js]
```

### Diễn giải chi tiết từng bước theo lời văn:

* **Bước 1 – Người dùng tương tác với bộ lọc (Filter):**
  Tại trang Lịch sử thao tác (`Phan_mem/FE/src/pages/ActionHistory.tsx`), người dùng mở thanh công cụ `ActionFilter.tsx`. Tại đây, người dùng có thể lựa chọn:
  - Chọn thiết bị cụ thể (Ví dụ: "Đèn Cảnh Báo Nhiệt Độ - D001").
  - Chọn trạng thái lệnh: Thành công (`SUCCESS`) hoặc Thất bại (`FAILED`).
  - Nhập chuỗi mốc thời gian cần tra cứu (ví dụ: `2026/09/20`, `11:14`).
  - Sau khi chọn xong, người dùng nhấn nút **"Tìm kiếm"**.

* **Bước 2 – Khởi tạo tham số và gọi Service:**
  Component `ActionHistory.tsx` đặt lại trang hiện tại về `page = 1` và gọi hàm `getActions(queryParams)` trong file `Phan_mem/FE/src/services/actionService.ts`. Service này chuyển đổi toàn bộ các trường lọc thành một chuỗi tham số truy vấn URL (Query String), ví dụ: `/api/actions?deviceId=1&status=SUCCESS&page=1&limit=20`.

* **Bước 3 – Backend xây dựng câu truy vấn SQL động:**
  Yêu cầu được gửi tới `Phan_mem/BE/controllers/actionController.js`. Hàm `getActions()` phân tích các tham số nhận được và tự động ghép nối câu lệnh SQL:
  - Sử dụng mệnh đề `WHERE 1=1` và nối thêm các điều kiện lọc như `AND a.device_id = ?`, `AND a.status = ?`, `AND a.action_time >= ?`.
  - Thực hiện liên kết bảng: `LEFT JOIN Devices d ON a.device_id = d.device_id` và `LEFT JOIN User u ON a.user_id = u.user_id` để lấy tên thiết bị và tên tài khoản người thực hiện thay vì chỉ hiển thị các con số ID vô nghĩa.
  - Sử dụng `COUNT(*)` để tính tổng số lượng bản ghi thỏa mãn điều kiện.
  - Áp dụng kỹ thuật phân trang với mệnh đề `ORDER BY a.action_time DESC LIMIT ? OFFSET ?`.

* **Bước 4 – Trả về kết quả và phân trang:**
  Backend gom dữ liệu thành một cấu trúc JSON gồm: danh sách các dòng lịch sử (`data`), tổng số bản ghi (`total`), trang hiện tại (`page`) và tổng số trang (`totalPages`), rồi phản hồi lại cho Frontend với mã trạng thái HTTP `200 OK`.

* **Bước 5 – Trình bày dữ liệu lên bảng:**
  Frontend nhận dữ liệu và truyền vào component `ActionTable.tsx` kết hợp `SensorPagination.tsx`:
  - Mỗi hàng hiển thị rõ: Mã thao tác (A001), Tên thiết bị, Hành động (BẬT / TẮT kèm màu sắc nhận diện), Trạng thái (Thành công), Tên người thực hiện, Thời điểm thực hiện và Độ trễ phản hồi của thiết bị.
  - Thanh phân trang cho phép người dùng chuyển nhanh giữa các trang dữ liệu tiếp theo.

---

## 📊 LUỒNG 4: TRA CỨU & XEM LỊCH SỬ DỮ LIỆU CẢM BIẾN (SENSOR DATA)

Luồng này cho phép người dùng tra cứu toàn bộ kho dữ liệu quan trắc môi trường đã được ghi nhận trong quá khứ theo cả mốc thời gian lẫn giá trị cảm biến (nhiệt độ, độ ẩm, ánh sáng).

```
[Người dùng chọn Cảm biến & Nhập Thời gian/Giá trị] ──> [SensorFilter.tsx] ──> [SensorData.tsx]
                                                                                │
                                                                                ▼ (HTTP GET /api/sensor-data)
[Hiển thị Bảng Dữ Liệu] <── (JSON Response) <── [DataSensor JOIN Sensor] <── [sensorController.js]
```

### Diễn giải chi tiết từng bước theo lời văn:

* **Bước 1 – Lựa chọn tiêu chí tra cứu:**
  Tại trang `SensorData.tsx`, người dùng chọn loại cảm biến cần theo dõi (Tất cả, Nhiệt độ, Độ ẩm hoặc Ánh sáng) và nhập tiêu chí tìm kiếm tại ô nhập liệu đa năng của `SensorFilter.tsx`. Ô tìm kiếm hỗ trợ:
  - Chuỗi mốc thời gian (ví dụ: `2026/09/20`, `11:14`).
  - Giá trị cảm biến (ví dụ: `32.6`, `68.5`, `32`, `68%`, `32.6°C`).
  - Biểu thức so sánh hoặc khoảng giá trị (ví dụ: `>30`, `<50`, `30 to 35`).

* **Bước 2 – Gửi yêu cầu truy vấn:**
  Hàm `fetchData()` trong `SensorData.tsx` kích hoạt hàm `getSensorData()` từ `Phan_mem/FE/src/services/sensorService.ts`, gửi request dạng `GET /api/sensor-data?sensorId=S001&search=32.6&page=1&limit=20` đến Backend.

* **Bước 3 – Xử lý dữ liệu tại Database:**
  Hàm `getSensorData()` trong `Phan_mem/BE/controllers/sensorController.js` tiếp nhận yêu cầu. Controller phân tích cú pháp tìm kiếm (nhận diện tự động giữa mốc thời gian và giá trị đo/phép so sánh), xây dựng mệnh đề SQL động để truy vấn bảng `DataSensor` kết hợp với bảng `Sensor` (`JOIN Sensor s ON ds.sensor_id = s.sensor_id`), sắp xếp giảm dần theo thời gian ghi nhận mới nhất (`ORDER BY ds.recorded_at DESC`) để người dùng luôn thấy dữ liệu mới nhất ở đầu bảng.

* **Bước 4 – Hiển thị số liệu trực quan kèm đơn vị đo:**
  Kết quả được trả về và hiển thị tại `SensorTable.tsx`. Bảng hiển thị rõ ràng: ID bản ghi, loại cảm biến, giá trị đo kèm đơn vị tương ứng (`°C` đối với nhiệt độ, `%` đối với độ ẩm, `lux` đối với ánh sáng) và thời gian ghi nhận chuẩn định dạng ngày/tháng/năm giờ:phút:giây.

---

## 🔐 LUỒNG 5: ĐĂNG NHẬP & XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION)

Đây là luồng bảo mật đảm bảo an toàn cho toàn bộ hệ thống, kiểm soát quyền hạn truy cập của người dùng bằng mã thông báo bảo mật **JSON Web Token (JWT)** và thuật toán mã hóa mật khẩu một chiều **Bcrypt**.

```
[Form Login] ──> [AuthContext] ──> [POST /api/auth/login] ──> [Bcrypt So sánh Hash] ──> [JWT Tạo Token]
      │                                                                                        │
      ▼                                                                                        ▼
[Chuyển hướng /dashboard] <── [Lưu Token vào LocalStorage] <── [Nhận JWT Token & User Profile] ┘
```

### Diễn giải chi tiết từng bước theo lời văn:

* **Bước 1 – Người dùng nhập thông tin đăng nhập:**
  Tại trang Đăng nhập (`Phan_mem/FE/src/pages/Login.tsx`), người dùng điền Tên đăng nhập/Email và Mật khẩu (ví dụ: tài khoản `hoang`, mật khẩu `123456`) rồi nhấn nút **"Đăng nhập"**.

* **Bước 2 – Chuyển giao qua Context quản lý trạng thái:**
  Trang Login gọi hàm `login()` được cung cấp bởi `Phan_mem/FE/src/context/AuthContext.tsx`. Context này tiếp tục gọi hàm `loginApi()` trong `Phan_mem/FE/src/services/authService.ts` để gửi một HTTP POST request chứa thông tin tài khoản tới điểm cuối `/api/auth/login` của Backend.

* **Bước 3 – Backend kiểm tra tài khoản và xác minh mật khẩu:**
  Tại `Phan_mem/BE/controllers/authController.js`, hàm `login()` thực hiện quy trình kiểm tra:
  1. Thực thi truy vấn `SELECT * FROM User WHERE username = ? OR email = ?` để tìm kiếm tài khoản trong cơ sở dữ liệu MySQL. Nếu không thấy, trả về mã lỗi `400` báo tài khoản không tồn tại.
  2. Lấy chuỗi băm mật khẩu đã lưu trong DB và dùng hàm `bcrypt.compare(password, user.password_hash)` để so khớp với mật khẩu người dùng vừa nhập. Nếu mật khẩu sai, lập tức từ chối và trả về lỗi.

* **Bước 4 – Ký và phát hành mã bảo mật JWT (JSON Web Token):**
  Khi tài khoản và mật khẩu hoàn toàn chính xác, Backend sử dụng thư viện `jsonwebtoken` cùng khóa bí mật của hệ thống (`JWT_SECRET`) để ký tạo một chuỗi mã hóa **JWT Token** có thời hạn hiệu lực 24 giờ. Token này gói gọn thông tin cơ bản của người dùng gồm `userId`, `username`, `role`.

* **Bước 5 – Phản hồi và lưu phiên đăng nhập phía Client:**
  Backend trả về mã `200 OK` kèm theo chuỗi Token và đối tượng thông tin người dùng. Phía Frontend:
  - `authService.ts` lưu chuỗi Token vào bộ nhớ trình duyệt `localStorage` dưới khóa `'smarthome_auth_token'`.
  - `AuthContext.tsx` cập nhật biến trạng thái `currentUser` và bật cờ `isAuthenticated = true`.
  - Ứng dụng tự động điều hướng người dùng chuyển thẳng vào trang chủ quản trị `/dashboard` mà không cần đăng nhập lại trong các lần truy cập tiếp theo.

---

## 👤 LUỒNG 6: XEM & CẬP NHẬT HỒ SƠ CÁ NHÂN (PROFILE)

Luồng quản lý thông tin tài khoản cho phép người dùng xem và cập nhật các thông tin cá nhân của mình trên hệ thống.

```
[Trang Profile] ──> [Chỉnh sửa thông tin] ──> [PUT /api/profile] ──> [MySQL UPDATE User] ──> [Cập nhật State UI]
```

### Diễn giải chi tiết từng bước theo lời văn:

* **Bước 1 – Tải thông tin hồ sơ:**
  Khi người dùng truy cập trang Hồ sơ (`Phan_mem/FE/src/pages/Profile.tsx`), component tự động gọi API `GET /api/profile` (có đính kèm JWT Token để Backend nhận diện danh tính người dùng). Backend truy vấn bảng `User` và trả về các thông tin cá nhân: Họ tên, Email, Số điện thoại, Địa chỉ, Ngày sinh và vai trò quản trị.

* **Bước 2 – Người dùng chỉnh sửa và nhấn Lưu:**
  Người dùng thay đổi các trường dữ liệu trên form `Phan_mem/FE/src/components/profile/PersonalInfo.tsx` và nhấn nút **"Lưu thay đổi"**.

* **Bước 3 – Gửi dữ liệu cập nhật:**
  Hàm `updateProfile()` trong `Phan_mem/FE/src/services/profileService.ts` đóng gói dữ liệu và gửi yêu cầu `PUT /api/profile` đến Backend.

* **Bước 4 – Cập nhật cơ sở dữ liệu và đồng bộ giao diện:**
  Hàm `updateProfile()` trong `Phan_mem/BE/controllers/profileController.js` thực thi câu lệnh SQL `UPDATE User SET full_name = ?, email = ?, phone = ?, address = ?, date_of_birth = ? WHERE user_id = ?`. Sau khi lưu thành công, Backend trả về dữ liệu người dùng mới nhất, Frontend hiển thị thông báo thành công và cập nhật lại thông tin trên toàn bộ giao diện (bao gồm cả ảnh đại diện và tên người dùng ở góc trên cùng của thanh Header).

---

## 📋 BẢNG TỔNG HỢP MỐI QUAN HỆ CÁC THÀNH PHẦN THEO TỪNG LUỒNG

| Tên Luồng Hoạt Động | Điểm Khởi Đầu (Trigger) | Thành Phần Xử Lý Chính | Điểm Đích (Destination) | Chuẩn Giao Tiếp / Công Nghệ |
|:---|:---|:---|:---|:---|
| **1. Điều khiển Bật/Tắt Đèn** | Người dùng bấm Toggle trên Web | `deviceController.js` $\rightarrow$ `mqttHandler.js` $\rightarrow$ `main.cpp` | Chân GPIO 0, 1, 20 trên ESP32 đổi trạng thái | HTTP REST, MQTT (`Device_control/thh`), WebSocket |
| **2. Dữ liệu Cảm biến Realtime** | Cảm biến môi trường AHT20 & BH1750 | `main.cpp` $\rightarrow$ `mqttHandler.js` $\rightarrow$ `useRealtimeData.ts` | Biểu đồ Chart.js và bảng `DataSensor` (MySQL) | I2C Bus, MQTT (`Sensor/thh`), WebSocket |
| **3. Lọc Lịch sử Thao tác** | Người dùng chọn bộ lọc & bấm Tìm kiếm | `actionController.js` (Dynamic SQL Query) | Bảng hiển thị `ActionTable.tsx` | HTTP GET, MySQL JOIN, React State |
| **4. Lọc Dữ liệu Cảm biến** | Người dùng chọn loại cảm biến & ngày | `sensorController.js` | Bảng hiển thị `SensorTable.tsx` | HTTP GET, MySQL Pagination |
| **5. Đăng nhập & Xác thực** | Người dùng nhập Form Login | `authController.js` (Bcrypt & JWT Sign) | LocalStorage & AuthContext | HTTP POST, JWT, Bcrypt |
| **6. Cập nhật Hồ sơ** | Người dùng chỉnh sửa Form Profile | `profileController.js` | Bảng `User` trong MySQL | HTTP PUT, MySQL UPDATE |

---

*Tài liệu được biên soạn đồng bộ chuẩn xác với cấu trúc mã nguồn dự án Smart Home IoT LOLIN C3 Mini.*
