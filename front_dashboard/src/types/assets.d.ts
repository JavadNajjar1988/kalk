// Type declarations for media assets
declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.webm' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.avi' {
  const src: string;
  export default src;
}

declare module '*.mov' {
  const src: string;
  export default src;
}

declare module '*.wmv' {
  const src: string;
  export default src;
}

declare module '*.flv' {
  const src: string;
  export default src;
}

declare module '*.mkv' {
  const src: string;  
  export default src;
}

// تعریف تایپ‌های مربوط به فایل‌های استاتیک
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.mp4' {
  const content: string;
  export default content;
}

// تعریف تایپ برای کتابخانه milsymbol
declare module 'milsymbol' {
  export interface SymbolOptions {
    size?: number;
    fill?: boolean;
    fillColor?: string;
    frame?: boolean;
    strokeWidth?: number;
    strokeColor?: string;
    outlineColor?: string;
    outlineWidth?: number;
    monoColor?: string;
    infoColor?: string;
    infoFields?: boolean;
    infoSize?: number;
    colorMode?: string;
    [key: string]: any;
  }

  export class Symbol {
    constructor(sidc: string, options?: SymbolOptions);
    asSVG(): string;
    asCanvas(ratio?: number): HTMLCanvasElement;
    getAnchor(): { x: number; y: number };
    getSize(): { width: number; height: number };
    getOctagonAnchor(): { x: number; y: number };
  }
} 