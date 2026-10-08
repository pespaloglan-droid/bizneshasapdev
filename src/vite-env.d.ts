/// <reference types="vite/client" />

/** Vite `?inline` — asseti base64 data-URL olarak derle (Excel'e gömmek için). */
declare module '*?inline' {
  const dataUrl: string;
  export default dataUrl;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}