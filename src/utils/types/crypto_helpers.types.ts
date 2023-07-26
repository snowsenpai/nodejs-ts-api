// ref @types/node: cypto.d.ts ln 262-265
type BinaryToTextEncoding = 'base64' | 'base64url' | 'hex' | 'binary';
type CharacterEncoding = 'utf-8';
type LegacyCharacterEncoding = 'ascii' | 'binary' | 'ucs-2';
export type Encoding = BinaryToTextEncoding | CharacterEncoding | LegacyCharacterEncoding;