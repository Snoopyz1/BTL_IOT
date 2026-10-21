// Action history types for the Smart Home IoT system

export type ActionType = 'TURN_ON' | 'TURN_OFF';

export type ActionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';

export interface ActionHistory {
  id: string;
  deviceId: string;
  deviceName: string;
  action: ActionType;
  status: ActionStatus;
  actionTime: string;
  responseTime?: string;
  responseDuration?: number; // ms
  createdBy: string;
}

export interface ActionQuery {
  deviceId?: string;
  action?: ActionType | '';
  status?: ActionStatus | '';
  time?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface ActionResponse {
  data: ActionHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
