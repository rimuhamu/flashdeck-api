export const success = <T>(data: T) => ({ status: 'success', data });
export const error = (message: string) => ({ status: 'error', error: message });
