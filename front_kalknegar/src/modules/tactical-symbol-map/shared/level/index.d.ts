export declare function leveldb(options?: {
    down?: any;
    up?: any;
    encoding?: string;
    prefix?: string;
}): any;

export declare function jsonDB(db: any): any;
export declare function wkbDB(db: any): any;
export declare function preferencesDB(db: any): any;
export declare function sessionDB(db: any): any;
export declare function schemaDB(db: any): any;

export declare function prefix(prefix: string): { gte: string; lte: string };
export declare function putOp(key: string, value: any): { type: "put"; key: string; value: any };
export declare function delOp(key: string): { type: "del"; key: string };

export declare function read(stream: any, decode: (data: any) => any): Promise<any[]>;

export declare const Decoders: {
    TUPLE: (data: { key: string; value: any }) => [string, any];
    ENTITY: (data: { key: string; value: any }) => { id: string;[key: string]: any };
};

export declare function readStream(db: any, options?: any): any;

export declare const Streams: {
    TUPLE: (db: any, options?: any) => any;
    VALUE: (db: any, options?: any) => any;
    KEY: (db: any, options?: any) => any;
};

export declare function readTuples(db: any, options?: any): Promise<[string, any][]>;
export declare function readEntities(db: any, options?: any): Promise<{ id: string;[key: string]: any }[]>;
export declare function readKeys(db: any, options?: any): Promise<string[]>;
export declare function readValues(db: any, options?: any): Promise<any[]>;

export declare function mget(
    decode: (key: string, value: any) => any,
    defaultValue?: any,
): (db: any, keys: string[]) => Promise<any[]>;

export declare const mgetTuples: (db: any, keys: string[]) => Promise<[string, any][]>;
export declare const mgetKeys: (db: any, keys: string[]) => Promise<string[]>;
export declare function mgetValues(defaultValue?: any): (db: any, keys: string[]) => Promise<any[]>;
export declare const mgetEntities: (db: any, keys: string[]) => Promise<{ id: string;[key: string]: any }[]>;

export declare function tuples(db: any, arg?: string | string[]): Promise<[string, any][]>;
export declare function keys(db: any, arg?: string | string[]): Promise<string[]>;
export declare function values(db: any, arg: string | string[], defaultValue?: any): Promise<any[]>;

export declare function existsKey(db: any, prefix: any): Promise<boolean>;
export declare function get(db: any, key: string, value?: any): Promise<any>;
export declare function mput(db: any, ...args: any[]): Promise<void>;
export declare function mdel(db: any, arg: string | string[]): Promise<void>;
export declare function tap(db: any, key: string, fn: (value: any) => any): Promise<void>;
