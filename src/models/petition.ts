export interface Petition {
    id: number;
    title: string;
    body: string;
    isFunded: boolean;
    minFundAmount?: string
    funding:{},
    signatureCount:string,
    creator:string,
    signatures?:string[]
}