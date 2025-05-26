export const successResponse = <T>(data: T) => ({ status: 'success', data });
export const errorResponse = (message: string) => ({
  status: 'error',
  error: message,
});
