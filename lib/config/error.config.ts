export type TStorageErrorCode = 'read_failed' | 'write_failed';

export class StorageError extends Error {
  private readonly body: { code: TStorageErrorCode };

  constructor(code: TStorageErrorCode, message: string) {
    super(message);
    this.name = 'StorageError';
    this.body = { code };
  }

  get code(): TStorageErrorCode {
    return this.body.code;
  }
}
