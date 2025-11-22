declare module "@syncpoint/signs" {
  export type SignsSymbolOptions = Record<string, unknown>;

  export class Symbol {
    constructor(sidc: string, options?: SignsSymbolOptions);
    asSVG(): string;
    getSize(): { width: number; height: number };
    getAnchor(): { x: number; y: number };
  }
}
