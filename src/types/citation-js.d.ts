// Type declarations for citation-js
declare module 'citation-js' {
  export class Cite {
    constructor(input: string | any[] | any);
    data: any[];
    format(format: string, options?: any): string;
    static async(input: string | any[] | any): Promise<Cite>;
  }

  export default Cite;
} 