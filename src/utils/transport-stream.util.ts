import * as rfs from 'rotating-file-stream';

export default function (options: any) {
  const { size, interval, compress, destination } = options;
  return rfs.createStream(options.fileName, {
    size: size || '500K',
    interval: interval || '14d',
    compress: compress || 'gzip',
    path: destination,
  });
}
