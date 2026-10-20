export type FoundItemPhotoStorage = {
  upload: (path: string, bytes: Buffer, contentType: string) => Promise<void>;
  remove: (path: string) => Promise<void>;
  createSignedUrl: (path: string, expiresIn: number) => Promise<string>;
};
