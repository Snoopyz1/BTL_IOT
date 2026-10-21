import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create Router to handle both /api prefix and root prefix
const router = express.Router();

// ─── Initial Mock Data ───────────────────────────────────

let mockUser = {
  id: 'U001',
  username: 'hoang',
  fullName: 'Hoàng Trần',
  email: 'hoang.tran@example.com',
  phone: '+84 912 345 678',
  dateOfBirth: '2000-01-15',
  address: 'Hà Nội, Việt Nam',
  avatar: '',
  role: 'Administrator',
  createdAt: '2026-01-01T00:00:00+07:00',
  updatedAt: '2026-08-19T07:00:00+07:00',
  socialLinks: {
    github: 'https://github.com/Snoopyz1/BTL_IOT',
    figma: 'https://figma.com/@usera',
    linkedin: 'https://linkedin.com/in/usera',
    postman: 'https://hoang2005cc-3372547.postman.co/workspace/5b8f1684-4063-45f7-82c7-0028ee682c3a/documentation/57489199-fd2ce726-1f9e-4507-bd6d-8758f08ce6de',
  },
};

const mockSensors = [
  {
    id: 'S001',
    name: 'Cảm biến nhiệt độ',
    type: 'temperature',
    unit: '°C',
    location: 'Phòng khách',
    status: 'ONLINE',
    createdAt: '2026-01-15T08:00:00+07:00',
    updatedAt: '2026-08-19T07:24:31+07:00',
  },
  {
    id: 'S002',
    name: 'Cảm biến độ ẩm',
    type: 'humidity',
    unit: '%',
    location: 'Phòng khách',
    status: 'ONLINE',
    createdAt: '2026-01-15T08:00:00+07:00',
    updatedAt: '2026-08-19T07:24:32+07:00',
  },
  {
    id: 'S003',
    name: 'Cảm biến ánh sáng',
    type: 'light',
    unit: 'lux',
    location: 'Phòng khách',
    status: 'ONLINE',
    createdAt: '2026-01-15T08:00:00+07:00',
    updatedAt: '2026-08-19T07:24:33+07:00',
  },
];

let mockDevices = [
  {
    id: 'D001',
    name: 'Đèn phòng khách',
    type: 'light',
    location: 'Phòng khách',
    status: 'ON',
    online: true,
    createdAt: '2026-01-15T08:00:00+07:00',
    updatedAt: '2026-08-19T07:20:00+07:00',
  },
  {
    id: 'D002',
    name: 'Đèn phòng ngủ',
    type: 'light',
    location: 'Phòng ngủ',
    status: 'OFF',
    online: true,
    createdAt: '2026-01-15T08:00:00+07:00',
    updatedAt: '2026-08-19T07:15:00+07:00',
  },
  {
    id: 'D003',
    name: 'Đèn nhà bếp',
    type: 'light',
    location: 'Nhà bếp',
    status: 'ON',
    online: true,
    createdAt: '2026-02-10T10:00:00+07:00',
    updatedAt: '2026-08-19T06:45:00+07:00',
  },
  {
    id: 'D004',
    name: 'Điều hòa nhiệt độ',
    type: 'ac',
    location: 'Phòng khách',
    status: 'ON',
    online: true,
    createdAt: '2026-01-20T09:00:00+07:00',
    updatedAt: '2026-08-19T07:00:00+07:00',
  },
  {
    id: 'D005',
    name: 'Quạt trần',
    type: 'fan',
    location: 'Phòng ngủ',
    status: 'OFF',
    online: true,
    createdAt: '2026-03-05T11:00:00+07:00',
    updatedAt: '2026-08-18T22:00:00+07:00',
  },
  {
    id: 'D006',
    name: 'Khóa cửa thông minh',
    type: 'lock',
    location: 'Cửa chính',
    status: 'ON',
    online: false,
    createdAt: '2026-04-01T14:00:00+07:00',
    updatedAt: '2026-08-17T18:30:00+07:00',
  },
];

// Generate mock sensor data history
function generateSensorData() {
  const records = [];
  let id = 1;
  const startDate = new Date('2026-08-01T00:00:00+07:00');
  const endDate = new Date('2026-08-19T07:25:00+07:00');
  const current = new Date(startDate);

  while (current <= endDate) {
    const hour = current.getHours();
    const dailyTempOffset = Math.sin((hour - 6) * Math.PI / 12) * 4;
    const tempValue = Math.round((27 + dailyTempOffset + (Math.random() - 0.5) * 2) * 10) / 10;
    const humidValue = Math.round(Math.max(40, Math.min(85, 70 - dailyTempOffset * 2 + (Math.random() - 0.5) * 8)) * 10) / 10;

    let lightValue;
    if (hour >= 6 && hour <= 18) {
      const dayProgress = Math.sin((hour - 6) * Math.PI / 12);
      lightValue = Math.round(Math.max(50, dayProgress * 1000 + (Math.random() - 0.5) * 200));
    } else {
      lightValue = Math.round(Math.max(0, Math.random() * 50));
    }

    const timestamp = current.toISOString();

    records.push({
      id: `SD${String(id++).padStart(5, '0')}`,
      sensorId: 'S001',
      sensorName: 'Cảm biến nhiệt độ',
      sensorType: 'temperature',
      value: tempValue,
      unit: '°C',
      recordedAt: timestamp,
    });

    records.push({
      id: `SD${String(id++).padStart(5, '0')}`,
      sensorId: 'S002',
      sensorName: 'Cảm biến độ ẩm',
      sensorType: 'humidity',
      value: humidValue,
      unit: '%',
      recordedAt: timestamp,
    });

    records.push({
      id: `SD${String(id++).padStart(5, '0')}`,
      sensorId: 'S003',
      sensorName: 'Cảm biến ánh sáng',
      sensorType: 'light',
      value: lightValue,
      unit: 'lux',
      recordedAt: timestamp,
    });

    current.setMinutes(current.getMinutes() + 20);
  }
  return records;
}

let mockSensorData = generateSensorData();

// Generate action history
function generateActions() {
  const actions = [];
  const statuses = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED', 'PENDING', 'TIMEOUT'];
  const actionTypes = ['TURN_ON', 'TURN_OFF'];

  for (let i = 0; i < 50; i++) {
    const device = mockDevices[i % mockDevices.length];
    const action = actionTypes[i % 2];
    const status = statuses[i % statuses.length];
    const actionTime = new Date(2026, 7, (i % 19) + 1, (i * 3) % 24, (i * 7) % 60).toISOString();

    actions.push({
      id: `A${String(i + 1).padStart(3, '0')}`,
      deviceId: device.id,
      deviceName: device.name,
      action,
      status,
      actionTime,
      responseTime: status === 'SUCCESS' ? new Date(new Date(actionTime).getTime() + 150).toISOString() : undefined,
      responseDuration: status === 'SUCCESS' ? 150 : undefined,
      createdBy: 'user123',
    });
  }
  return actions;
}

let mockActions = generateActions();

// ─── 0. AUTH API ──────────────────────────────────────────

// Login
router.post('/auth/login', (req, res) => {
  const { usernameOrEmail, password } = req.body || {};
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ success: false, message: 'Tên đăng nhập và mật khẩu không được để trống! Vui lòng nhập Body (JSON)' });
  }
  res.json({
    success: true,
    token: 'mock_jwt_token_U001',
    user: mockUser,
    message: 'Đăng nhập thành công!',
  });
});

// Register
router.post('/auth/register', (req, res) => {
  const body = req.body || {};
  const { fullName, username, email, password } = body;
  if (!fullName || !username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng truyền đủ Body JSON: fullName, username, email, password' });
  }

  const newUser = {
    id: `U${String(Date.now()).slice(-3)}`,
    username,
    fullName,
    email,
    phone: body.phone || '+84 900 000 000',
    dateOfBirth: '2000-01-01',
    address: 'Việt Nam',
    avatar: '',
    role: 'User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    socialLinks: {
      github: 'https://github.com/Snoopyz1/BTL_IOT',
      postman: 'https://hoang2005cc-3372547.postman.co/workspace/5b8f1684-4063-45f7-82c7-0028ee682c3a/documentation/57489199-fd2ce726-1f9e-4507-bd6d-8758f08ce6de',
    },
  };

  res.json({
    success: true,
    token: `mock_jwt_token_${newUser.id}`,
    user: newUser,
    message: 'Đăng ký tài khoản thành công!',
  });
});

// Current User (Me)
router.get('/auth/me', (req, res) => {
  res.json({
    success: true,
    user: mockUser,
  });
});

// ─── 1. SENSORS API ───────────────────────────────────────

// Get all sensors
router.get('/sensors', (req, res) => {
  res.json(mockSensors);
});

// Get single sensor by ID
router.get('/sensors/:id', (req, res) => {
  const targetId = String(req.params.id || '').trim().toLowerCase();
  const sensor = mockSensors.find((s) => s.id.toLowerCase() === targetId);
  if (!sensor) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy cảm biến' });
  }
  res.json(sensor);
});

// Format date as yyyy/MM/dd HH:mm:ss
function formatDateTime(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}/${MM}/${dd} ${hh}:${mm}:${ss}`;
}

// Match time query string against timestamp
function matchTimeQuery(isoOrDate, query) {
  if (!query || !String(query).trim()) return true;
  const q = String(query).trim().toLowerCase();
  const formattedSlash = formatDateTime(isoOrDate).toLowerCase();
  const formattedHyphen = formattedSlash.replace(/\//g, '-');
  if (formattedSlash.includes(q) || formattedHyphen.includes(q)) return true;
  const qNormalizedSlash = q.replace(/-/g, '/');
  const qNormalizedHyphen = q.replace(/\//g, '-');
  if (formattedSlash.includes(qNormalizedSlash) || formattedHyphen.includes(qNormalizedHyphen)) return true;
  const rawIso = String(isoOrDate).toLowerCase();
  if (rawIso.includes(q)) return true;
  const d = new Date(isoOrDate);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (`${dd}/${MM}/${yyyy}`.includes(q) || `${dd}-${MM}-${yyyy}`.includes(q)) return true;
  }
  return false;
}

// Get sensor data history with filters and pagination
router.get('/sensor-data', (req, res) => {
  let filtered = [...mockSensorData];
  const { sensorId, sensorType, time, from, to, page = '1', limit = '20' } = req.query;

  if (sensorId) {
    const cleanSensorId = String(sensorId).trim().toLowerCase();
    filtered = filtered.filter((d) => d.sensorId.toLowerCase() === cleanSensorId);
  }
  if (sensorType) {
    filtered = filtered.filter((d) => d.sensorType === String(sensorType).trim());
  }
  if (time && String(time).trim()) {
    filtered = filtered.filter((d) => matchTimeQuery(d.recordedAt, time));
  }
  if (from) {
    filtered = filtered.filter((d) => d.recordedAt >= String(from));
  }
  if (to) {
    filtered = filtered.filter((d) => d.recordedAt <= String(to));
  }

  filtered.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum);
  const start = (pageNum - 1) * limitNum;
  const data = filtered.slice(start, start + limitNum);

  res.json({
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
  });
});

// ─── 2. DEVICES API ───────────────────────────────────────

// Get all devices
router.get('/devices', (req, res) => {
  res.json(mockDevices);
});

// Get single device by ID
router.get('/devices/:id', (req, res) => {
  const targetId = String(req.params.id || '').trim().toLowerCase();
  const device = mockDevices.find((d) => d.id.toLowerCase() === targetId);
  if (!device) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
  }
  res.json(device);
});

// Send device command
router.post('/devices/:id/command', (req, res) => {
  const targetId = String(req.params.id || '').trim().toLowerCase();
  const device = mockDevices.find((d) => d.id.toLowerCase() === targetId);
  if (!device) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
  }

  const { action } = req.body || {};
  if (!action || (action !== 'TURN_ON' && action !== 'TURN_OFF')) {
    return res.status(400).json({ success: false, message: 'Lệnh không hợp lệ. Sử dụng TURN_ON hoặc TURN_OFF' });
  }

  device.status = action === 'TURN_ON' ? 'ON' : 'OFF';
  device.updatedAt = new Date().toISOString();

  // Add to action history
  mockActions.unshift({
    id: `A${String(mockActions.length + 1).padStart(3, '0')}`,
    deviceId: device.id,
    deviceName: device.name,
    action,
    status: 'SUCCESS',
    actionTime: new Date().toISOString(),
    responseTime: new Date().toISOString(),
    responseDuration: 120,
    createdBy: 'user123',
  });

  res.json({
    success: true,
    message: `Đã ${action === 'TURN_ON' ? 'bật' : 'tắt'} ${device.name} thành công!`,
    device,
  });
});

// ─── 3. ACTION HISTORY API ────────────────────────────────

// Get actions history with filters
router.get('/actions', (req, res) => {
  let filtered = [...mockActions];
  const { deviceId, action, status, time, from, to, page = '1', limit = '20' } = req.query;

  if (deviceId) {
    filtered = filtered.filter((a) => a.deviceId === deviceId);
  }
  if (action) {
    filtered = filtered.filter((a) => a.action === action);
  }
  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }
  if (time && String(time).trim()) {
    filtered = filtered.filter((a) => matchTimeQuery(a.actionTime, time));
  }
  if (from) {
    filtered = filtered.filter((a) => a.actionTime >= String(from));
  }
  if (to) {
    filtered = filtered.filter((a) => a.actionTime <= String(to));
  }

  filtered.sort((a, b) => new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime());

  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limitNum);
  const start = (pageNum - 1) * limitNum;
  const data = filtered.slice(start, start + limitNum);

  res.json({
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
  });
});

// ─── 4. PROFILE API ───────────────────────────────────────

// Get user profile
router.get('/profile', (req, res) => {
  res.json(mockUser);
});

// Update user profile
router.put('/profile', (req, res) => {
  mockUser = {
    ...mockUser,
    ...(req.body || {}),
    updatedAt: new Date().toISOString(),
  };
  res.json({
    success: true,
    message: 'Cập nhật thông tin cá nhân thành công!',
    user: mockUser,
  });
});

// Mount router on both '/api' and '/'
app.use('/api', router);
app.use('/', router);

// ─── Start Server ─────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 SmartHome Mock API Server đang chạy tại: http://localhost:${PORT}`);
});
