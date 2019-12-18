export interface Token {
  id: String;
  address: String;
  name: String;
  symbol: String;
  decimal: Number;
}
export interface TokenPair {
  tokenASymbol: string;
  tokenBSymbol: string;
}

export interface TokenStatus {
  TokenBalance: Number;
  TokenAllowance: Number;
}
