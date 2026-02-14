export interface AccountRequest {
  id?: string;
  accountNumbers: string[];
  startDate: Date;
  endDate: Date;
  status: RequestStatus;
  createdAt: Date;
  results?: AccountRequestResult[];
}

export enum RequestStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILED = 'FAILED'
}

export interface AccountRequestResult {
  accountNumber: string;
  status: AccountStatus;
  errorType?: ErrorType;
  errorMessage?: string;
  downloadUrl?: string;
}

export enum AccountStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum ErrorType {
  EXCESSIVE_MOVEMENTS = 'EXCESSIVE_MOVEMENTS',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_ACCOUNT = 'INVALID_ACCOUNT'
}

export interface AccountRequestPayload {
  accountNumbers: string[];
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
