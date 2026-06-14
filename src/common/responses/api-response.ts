export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface ApiMessageResponse {
  message: string;
}
