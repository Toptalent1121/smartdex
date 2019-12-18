import {
  FeesRequest,
  FeesResponse,
  HttpClient,
  TokenPairsItem,
  OrderbookResponse,
  OrderbookRequest,
} from '@0xproject/connect';
import { Order } from '../config/order';
import { TokenPair } from '../config/token';
import { constant } from '../config/constant';
import { ZeroExService } from './zeroExService';
import { SignedOrder } from '0x.js';

export class OrderService {
  private httpClient: HttpClient;
  private zeroExService: ZeroExService;
  public constructor() {
    this.httpClient = new HttpClient(constant.API_URL);
    console.log('Initializing orderService....');
  }

  public async getOrderBook(orderbookRequest: OrderbookRequest): Promise<OrderbookResponse> {
    console.log('trying to get orderbook...');
    try {
      const orderBookResponse: OrderbookResponse = await this.httpClient.getOrderbookAsync(orderbookRequest);
      if (orderBookResponse) {
        return orderBookResponse;
      } else {
        const orderBookNullResponse: OrderbookResponse = {bids: [], asks: []};
        return orderBookNullResponse;
      }
    } catch (e) {
      throw e;
    }
  }

  public async getTokenPairs(): Promise<TokenPair[]> {
    return new Promise<TokenPair[]>((resolve, reject) => {
      const result: Promise<TokenPairsItem[]> = this.httpClient.getTokenPairsAsync();
      result.then(pairs => {
        resolve(this.convertTokenPairs(pairs));
      });
    });
  }

  public async getFeesAsync(feesRequest: FeesRequest) {
    return await this.httpClient.getFeesAsync(feesRequest);
  }

  public async SubmitOrder(signedOrder: SignedOrder) {
    return await this.httpClient.submitOrderAsync(signedOrder);
  }
  private async convertTokenPairs(pairs: TokenPairsItem[]): Promise<TokenPair[]> {
    const tokens: TokenPair[] = new Array();
    for (const pair of pairs) {
      const tokenASymbol = await this.zeroExService.getTokenSymbol(pair.tokenA.address);
      const tokenBSymbol = await this.zeroExService.getTokenSymbol(pair.tokenB.address);

      if (tokenASymbol && tokenBSymbol) {
        const tokenPair: TokenPair = {
          tokenASymbol: tokenASymbol,
          tokenBSymbol: tokenBSymbol,
        };

        tokens.push(tokenPair);
      }
    }
    return tokens;
  }
}
