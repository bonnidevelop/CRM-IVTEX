import type { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  statusCode = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  res.status(statusCode).json(response);
}