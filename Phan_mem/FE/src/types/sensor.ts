// Sensor types for the Smart Home IoT system

export type SensorType = 'temperature' | 'humidity' | 'light';

export type SensorStatus = 'ONLINE' | 'OFFLINE';

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  unit: string;
  location: string;
  status: SensorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SensorData {
  id: string;
  sensorId: string;
  sensorName: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  recordedAt: string;
}

export interface SensorDataQuery {
  sensorId?: string;
  sensorType?: SensorType;
  time?: string;
  search?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface SensorDataResponse {
  data: SensorData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RealtimeSensorValue {
  temperature: number;
  humidity: number;
  light: number;
  updatedAt: string;
  temperatureChange: number;
  humidityChange: number;
  lightChange: number;
}

export interface ChartDataPoint {
  time: string;
  timestamp: number;
  temperature?: number;
  humidity?: number;
  light?: number;
}
