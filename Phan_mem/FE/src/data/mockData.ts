import type { Sensor } from '../types/sensor';
import type { Device } from '../types/device';
import type { ActionHistory } from '../types/action';
import type { User } from '../types/user';
import type { SensorData } from '../types/sensor';

// ─── Sensors ─────────────────────────────────────────────
export const mockSensors: Sensor[] = [
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

// ─── Devices ─────────────────────────────────────────────
export const mockDevices: Device[] = [
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

// ─── User Profile ────────────────────────────────────────
export const mockUser: User = {
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
    github: 'https://github.com',
    figma: 'https://figma.com',
    postman: 'https://documenter.getpostman.com/view/smarthome-iot-api',
    pdfDocument: '/SmartHome_API_Docs.pdf',
    pdfFileName: 'SmartHome_API_Docs.pdf',
  },
};

// ─── Helper: Generate sensor data records ────────────────
function generateSensorDataRecords(): SensorData[] {
  const records: SensorData[] = [];
  let id = 1;

  const startDate = new Date('2026-08-01T00:00:00+07:00');
  const endDate = new Date('2026-08-19T07:25:00+07:00');

  let tempBase = 26;
  let humidBase = 60;
  let lightBase = 500;

  const current = new Date(startDate);

  while (current <= endDate) {
    const hour = current.getHours();
    const dailyTempOffset = Math.sin((hour - 6) * Math.PI / 12) * 4;
    tempBase = 27 + dailyTempOffset + (Math.random() - 0.5) * 2;
    const tempValue = Math.round(tempBase * 10) / 10;

    humidBase = 70 - dailyTempOffset * 2 + (Math.random() - 0.5) * 8;
    const humidValue = Math.round(Math.max(40, Math.min(85, humidBase)) * 10) / 10;

    let lightValue: number;
    if (hour >= 6 && hour <= 18) {
      const dayProgress = Math.sin((hour - 6) * Math.PI / 12);
      lightBase = dayProgress * 1000 + (Math.random() - 0.5) * 200;
      lightValue = Math.round(Math.max(50, lightBase));
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

    current.setMinutes(current.getMinutes() + 10 + Math.floor(Math.random() * 10));
  }

  return records;
}

// ─── Helper: Generate action history records ─────────────
function generateActionHistory(): ActionHistory[] {
  const actions: ActionHistory[] = [];
  const devices = mockDevices;
  const statuses: Array<'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'PENDING'> = [
    'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS',
    'FAILED', 'TIMEOUT', 'PENDING',
  ];
  const actionTypes: Array<'TURN_ON' | 'TURN_OFF'> = ['TURN_ON', 'TURN_OFF'];

  for (let i = 0; i < 50; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const day = 1 + Math.floor(Math.random() * 19);
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    const actionTime = new Date(2026, 7, day, hour, minute, second);

    let responseTime: string | undefined;
    let responseDuration: number | undefined;

    if (status === 'SUCCESS') {
      responseDuration = 50 + Math.floor(Math.random() * 300);
      const rt = new Date(actionTime.getTime() + responseDuration);
      responseTime = rt.toISOString();
    } else if (status === 'FAILED') {
      responseDuration = 200 + Math.floor(Math.random() * 500);
      const rt = new Date(actionTime.getTime() + responseDuration);
      responseTime = rt.toISOString();
    } else if (status === 'TIMEOUT') {
      responseDuration = 5000;
    }

    actions.push({
      id: `A${String(i + 1).padStart(3, '0')}`,
      deviceId: device.id,
      deviceName: device.name,
      action,
      status,
      actionTime: actionTime.toISOString(),
      responseTime,
      responseDuration,
      createdBy: 'hoang',
    });
  }

  actions.sort((a, b) => new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime());

  return actions;
}

// ─── Exported Data ───────────────────────────────────────
export const mockSensorData: SensorData[] = generateSensorDataRecords();
export const mockActionHistory: ActionHistory[] = generateActionHistory();
