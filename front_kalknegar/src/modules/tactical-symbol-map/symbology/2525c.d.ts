export declare function parameterized(sidc: string): string | null;
export declare function schemaCode(sidc: string): string | null;
export declare function battleDimensionCode(sidc: string): string | null;
export declare function identityCode(sidc: string): string;
export declare function statusCode(sidc: string): string;
export declare function functionIdCode(sidc: string): string | null;
export declare function modifierCode(sidc: string): string;
export declare function echelonCode(sidc: string): string;
export declare function mobilityCode(sidc: string): string;

export declare function format(
    sidc: string,
    options: {
        schema?: string;
        identity?: string;
        battleDimension?: string;
        status?: string;
        modifier?: string;
        echelon?: string;
        mobility?: string;
        functionId?: string;
    },
): string | null;

export declare const MODIFIERS: Record<string, string>;

interface SymbolDescriptor {
    parameterized: string;
    sidc: string;
    hierarchy: string;
    scope: string;
    dimensions: string[];
    geometry: {
        type: string;
        layout?: string;
        [key: string]: any;
    };
    class?: string;
}

export declare const symbols: Record<string, SymbolDescriptor>;
export declare const descriptors: Record<string, SymbolDescriptor>;

export declare function descriptor(sidc: string): SymbolDescriptor | undefined;
export declare function geometry(sidc: string): SymbolDescriptor["geometry"] | undefined;
export declare function geometryType(sidc: string): string | undefined;
export declare function className(sidc: string): string | undefined;
export declare function specialization(sidc: string): string | undefined;
