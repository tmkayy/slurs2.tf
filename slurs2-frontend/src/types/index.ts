export interface PlayerSummary {
  rank: number;
  steamId: string;
  steamName: string;
  country: string | null;
  slurCount: number;
}

export interface SlurInstance {
  message: string;
  logId: number;
  logUrl: string;
  slurCount: number;
  messageDate: string;
  slurType: number;
}

export interface PlayerDetail {
  steamId: string;
  steamName: string;
  country: string | null;
  slurInstances: SlurInstance[];
  lastScannedLogDate: string | null;
}