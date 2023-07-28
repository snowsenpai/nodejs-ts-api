// ref @types/node: cypto.d.ts
export type BinaryToTextEncoding = 'base64' | 'base64url' | 'hex';
export type CharacterEncoding = 'utf-8';
export type LegacyCharacterEncoding = 'ascii';
export type Encoding = BinaryToTextEncoding | CharacterEncoding | LegacyCharacterEncoding;