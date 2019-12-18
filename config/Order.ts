import { ECSignature } from './ecSignature';

export interface Order {
  orderHash: string;
  maker: string;
  taker: string;
  makerFee: string;
  takerFee: string;
  makerTokenAmount: string;
  takerTokenAmount: string;
  remainedMakerTokenAmount: string;
  remainedTakerTokenAmount: string;
  makerTokenAddress: string;
  takerTokenAddress: string;
  ecSignature: ECSignature;
  salt: string;
  exchangeContractAddress: string;
  feeRecipient: string;
  expirationUnixTimestampSec: string;
  valueRequired: string;
}

export interface SignedOrder {
  maker: string;
  taker: string;
  makerTokenAddress: string;
  takerTokenAddress: string;
  makerFee: string;
  takerFee: string;
  makerTokenAmount: string;
  takerTokenAmount: string;
  expirationUnixTimestampSec: string;
  feeRecipient: string;
  salt: string;
  ecSignature: ECSignature;
  exchangeContractAddress: string;
}
