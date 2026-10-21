# 🏡 BTL IoT - Hệ Thống Smart Home Giám Sát & Điều Khiển Thiết Bị

Hệ thống IoT End-to-End hoàn chỉnh bao gồm giám sát thông số môi trường (nhiệt độ, độ ẩm, ánh sáng) và điều khiển các thiết bị trong nhà theo thời gian thực.

---

## 🏗️ Cấu Trúc Dự Án (Repository Structure)

```text
├── Phan_cung/                          # Firmware vi điều khiển (ESP32 Lolin C3 Mini)
│   ├── src/main.cpp                    # Mã nguồn C++ đọc cảm biến, gửi MQTT & nhận điều khiển
│   ├── include/                        # Thư viện header
│   └── platformio.ini                  # Cấu hình PlatformIO cho mạch phần cứng
│
├── Phan_mem/
│   ├── BE/                             # Backend Service (Node.js + Express + MySQL + MQTT)
│   │   ├── config/                     # Cấu hình kết nối DB, MQTT
│   │   ├── controllers/                # Xử lý logic API (Sensor, Device, Auth, Profile)
│   │   ├── database/                   # Schema và script khởi tạo MySQL
│   │   ├── routes/                     # Định nghĩa REST API endpoints
│   │   ├── services/                   # Xử lý giao tiếp MQTT và WebSocket thời gian thực
│   │   ├── server.js                   # Điểm khởi chạy Backend server (Port 5000)
│   │   └── .env.example                # File mẫu cấu hình môi trường Backend
│   │
│   └── FE/                             # Frontend Dashboard (React + TypeScript + Vite)
│       ├── src/
│       │   ├── components/             # Các UI components (Dashboard, Chart, Filter, Table)
│       │   ├── pages/                  # Các trang giao diện (Dashboard, SensorData, History, Profile)
│       │   ├── services/               # Gọi API REST & lắng nghe WebSocket
│       │   └── types/                  # Định nghĩa TypeScript interfaces
│       └── .env.example                # File mẫu cấu hình môi trường Frontend
│
├── platformio.ini                      # Cấu hình PlatformIO cấp root
├── LUONG_DU_LIEU.md                    # Tài liệu đặc tả kỹ thuật chi tiết các luồng dữ liệu
├── luong.md                            # Tài liệu thuyết minh hoạt động hệ thống
└── README.md                           # Giới thiệu & hướng dẫn triển khai
```

---

## ⚡ 1. Tầng Phần Cứng (Hardware)

- **Vi điều khiển:** ESP32 Lolin C3 Mini (Lõi RISC-V 32-bit, tích hợp Wi-Fi 2.4GHz & Bluetooth 5).
- **Cảm biến:**
  - **AHT20:** Đo nhiệt độ (°C) và độ ẩm (%RH) qua giao tiếp I2C (`SDA = GPIO 8`, `SCL = GPIO 9`).
  - **BH1750:** Đo cường độ ánh sáng (Lux) qua giao tiếp I2C.
- **Thiết bị chấp hành:**
  - **LED 1 (GPIO 0):** Đại diện thiết bị làm mát/nhiệt độ.
  - **LED 2 (GPIO 1):** Đại diện máy hút ẩm.
  - **LED 3 (GPIO 20):** Đại diện hệ thống đèn chiếu sáng.
- **Giao thức truyền thông:** MQTT Client kết nối broker công cộng HiveMQ.

---

## 🌐 2. Tầng Phần Mềm Backend (BE)

- **Công nghệ:** Node.js, Express, `mysql2`, `mqtt`, `ws` (WebSocket), `jsonwebtoken`.
- **Chức năng:**
  - Kết nối MQTT Broker nhận dữ liệu từ topic `Sensor/thh`, phân tích và lưu vào MySQL.
  - Nhận lệnh điều khiển từ Web qua REST API, publish vào `Device_control/thh`.
  - Nhận phản hồi trạng thái từ `Device_respond/thh` và lưu lịch sử hành động (Action History).
  - Đẩy dữ liệu tức thời tới Frontend qua WebSocket.
  - Tích hợp bộ giả lập dữ liệu (Simulator) hỗ trợ kiểm thử khi không có phần cứng vật lý.

### Hướng dẫn cài đặt Backend:
```bash
cd Phan_mem/BE
npm install
cp .env.example .env
# Chỉnh sửa file .env với thông số kết nối MySQL của bạn
npm start
```

---

## 💻 3. Tầng Giao Diện Người Dùng Frontend (FE)

- **Công nghệ:** React 18, TypeScript, Vite, TailwindCSS, Chart.js, Lucide Icons.
- **Chức năng:**
  - **Dashboard:** Thẻ hiển thị số đo tức thời, biểu đồ đường trực quan theo thời gian thực, công tắc gạt bật/tắt thiết bị tức thời.
  - **Sensor Data:** Bảng tra cứu, phân trang, lọc và tìm kiếm lịch sử các chỉ số cảm biến.
  - **Action History:** Bảng theo dõi lịch sử điều khiển thiết bị (ai thao tác, thiết bị nào, trạng thái, thời gian).
  - **Profile:** Quản lý thông tin tài khoản và thông tin nhà phát triển.

### Hướng dẫn cài đặt Frontend:
```bash
cd Phan_mem/FE
npm install
cp .env.example .env
npm run dev
```

---

## 📡 4. Cấu Hình MQTT Topics

| Topic MQTT | Hướng truyền | Nội dung tin nhắn (JSON) |
| :--- | :--- | :--- |
| `Sensor/thh` | ESP32 ➔ Backend | `{"temperature": 28.5, "humidity": 65.2, "light": 320}` |
| `Device_control/thh` | Backend ➔ ESP32 | `{"device": "LED1", "status": "ON"}` |
| `Device_respond/thh` | ESP32 ➔ Backend | `{"LED1": "ON", "LED2": "OFF", "LED3": "OFF"}` |

---

## 👥 Tác Giả & Bản Quyền
Dự án Bài tập lớn môn Internet of Things (IoT) - Học viện Công nghệ Bưu chính Viễn thông (PTIT).
