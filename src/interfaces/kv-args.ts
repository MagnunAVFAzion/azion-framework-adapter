interface KVArgs {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  path: string;
  retries: number;
}

export { KVArgs }