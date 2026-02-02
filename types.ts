
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Finding {
  source: string;
  summary: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Alert';
}

export interface OsintResult {
  phoneNumber: string;
  country: string;
  operator: string;
  circle: string;
  riskLevel: RiskLevel;
  confidenceScore: number;
  isValid: boolean;
  findings: Finding[];
  metadata: {
    connectionType: string;
    isDND: boolean;
    potentialOwnerType: string;
  };
}

export interface AnalysisState {
  isAnalyzing: boolean;
  result: OsintResult | null;
  error: string | null;
  batchResults: OsintResult[];
  batchProgress: number;
}
