# 📘 Tài Liệu Mô Tả Chi Tiết API - SmartHome IoT Management

Tập tin [`api_test.http`](file:///d:/PTIT/IOT/IOT/WEB/api_test.http) đã được tạo tại thư mục gốc của dự án. Bạn có thể sử dụng với extension **REST Client** trên VS Code, hoặc nhập vào Postman / Insomnia / cURL.

---

## 📌 Base URL
- **Local Server:** `http://localhost:5500/api` (Vite Proxy) hoặc `http://localhost:5000/api` (Backend Express Server)

---

## 📊 Bảng Danh Sách API Hệ Thống

| STT | Phương thức | Đường dẫn (Endpoint) | Quyền truy cập | Tham số đầu vào (Input) | Dữ liệu trả về (Response Output) |
| :---: | :---: | :--- | :---: | :--- | :--- |
| **1** | `POST` | `/api/auth/login` | Public | **Body (JSON):**<br>`usernameOrEmail`: string<br>`password`: string | `{ success: true, token: string, user: UserObject, message: string }` |
| **2** | `POST` | `/api/auth/register` | Public | **Body (JSON):**<br>`fullName`: string<br>`username`: string<br>`email`: string<br>`password`: string<br>`phone` *(optional)*: string | `{ success: true, token: string, user: UserObject, message: string }` |
| **3** | `GET` | `/api/auth/me` | Bearer Token | **Header:**<br>`Authorization: Bearer <token>` | `{ success: true, user: UserObject }` |
| **4** | `GET` | `/api/sensors` | Public / User | *Không có* | Danh sách cảm biến `[ { id, name, type, unit, location, status } ]` |
| **5** | `GET` | `/api/sensors/:id` | Public / User | **Path Param:**<br>`id`: string (Ví dụ: `S001`) | Chi tiết cảm biến `{ id, name, type, unit, location, status }` |
| **6** | `GET` | `/api/sensor-data` | Public / User | **Query Params:**<br>`sensorId`: string<br>`sensorType`: string<br>`from`: YYYY-MM-DD<br>`to`: YYYY-MM-DD<br>`page`: number (default: 1)<br>`limit`: number (default: 20) | Kết quả phân trang: `{ data: [SensorData], total, page, limit, totalPages }` |
| **7** | `GET` | `/api/devices` | Public / User | *Không có* | Danh sách thiết bị `[ { id, name, type, location, status, online } ]` |
| **8** | `GET` | `/api/devices/:id` | Public / User | **Path Param:**<br>`id`: string (Ví dụ: `D001`) | Chi tiết thiết bị `{ id, name, type, location, status, online }` |
| **9** | `POST` | `/api/devices/:id/command` | Public / User | **Path Param:** `id`<br>**Body (JSON):**<br>`action`: `"TURN_ON"` \| `"TURN_OFF"` | `{ success: true, message: string, device: DeviceObject }` |
| **10** | `GET` | `/api/actions` | Public / User | **Query Params:**<br>`deviceId`: string<br>`action`: `"TURN_ON"` \| `"TURN_OFF"`<br>`status`: `"SUCCESS"` \| `"FAILED"` \| `"PENDING"` \| `"TIMEOUT"`<br>`from`: YYYY-MM-DD<br>`to`: YYYY-MM-DD<br>`page`: number (default: 1)<br>`limit`: number (default: 20) | Kết quả phân trang: `{ data: [ActionHistory], total, page, limit, totalPages }` |
| **11** | `GET` | `/api/profile` | Bearer Token / User | *Không có* | Thông tin cá nhân `{ id, username, fullName, email, phone, address, socialLinks }` |
| **12** | `PUT` | `/api/profile` | Bearer Token / User | **Body (JSON):**<br>`fullName`: string<br>`email`: string<br>`phone`: string<br>`dateOfBirth`: string<br>`address`: string<br>`socialLinks`: object | `{ success: true, message: string, user: UserObject }` |

---

## 🔍 Ví Dụ Chi Tiết Cho Các API

### 1. Đăng nhập (`POST /api/auth/login`)
**Input Body:**
```json
{
  "usernameOrEmail": "user123",
  "password": "password123"
}
```

### 2. Điều khiển thiết bị (`POST /api/devices/D001/command`)
**Input Body:**
```json
{
  "action": "TURN_ON"
}
```
**cURL:**
```bash
curl -X POST http://localhost:5500/api/devices/D001/command \
  -H "Content-Type: application/json" \
  -d '{"action": "TURN_ON"}'
```

### 3. Cập nhật Profile (`PUT /api/profile`)
**Input Body:**
```json
{
  "fullName": "Hoàng Trần",
  "email": "hoang.tran@example.com",
  "phone": "+84 912 345 678",
  "dateOfBirth": "2000-01-15",
  "address": "Hà Nội, Việt Nam",
  "socialLinks": {
    "github": "https://github.com/hoangtran"
  }
}
```
