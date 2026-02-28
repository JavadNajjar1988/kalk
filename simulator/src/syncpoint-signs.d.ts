declare module '@syncpoint/signs' {
    export class Symbol {
        constructor(sidc: string, options?: Record<string, any>);
        asSVG(): string;
    }
}
