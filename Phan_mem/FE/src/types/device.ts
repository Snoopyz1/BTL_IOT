// Device types for the Smart Home IoT system

export type DeviceType = 'light' | 'fan' | 'ac' | 'lock' | 'curtain' | 'speaker';

export type DeviceStatus = 'ON' | 'OFF';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  location: string;
  status: DeviceStatus;
  online: boolean;
  mqttKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCommand {
  action: 'TURN_ON' | 'TURN_OFF';
}

export interface DeviceCommandResponse {
  success: boolean;
  device: Device;
  message: string;
  responseTime: number; // ms
}
