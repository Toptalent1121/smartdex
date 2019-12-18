
import { Order } from '../config/order';
import { TokenPair, TokenStatus } from '../config/token';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { constant } from '../config/constant';
import { BigNumber } from 'bignumber.js';
import * as _ from 'lodash';
import * as Web3 from 'web3';
import FilterSubprovider = require('web3-provider-engine/subproviders/filters');
import * as Web3ProviderEngine from 'web3-provider-engine';
import { InjectedWeb3Subprovider, RedundantRPCSubprovider } from '@0xproject/subproviders';
import { ZeroEx, TransactionReceiptWithDecodedLogs, TransactionOpts, SignedOrder, Token } from '0x.js';
// declare var web3;
const DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1);
export class ZeroExService {
    isLoggedIn: Boolean = false;
    private zeroEx: ZeroEx;
    private _userAddress: string;
    private _defaultGasPrice: BigNumber;
    private transactionOpts: TransactionOpts = {
      gasLimit: constant.GasLimit,
      gasPrice: new BigNumber(constant.GasPrice)
    };
    web3: any;
    public constructor() {
      ZeroExService._onPageLoadAsync();
      const defaultGasPrice = constant.GWEI_IN_WEI * 30;
      this._defaultGasPrice = new BigNumber(defaultGasPrice);
      const injectedWeb3 = (window as any).web3;
      const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);

      let providerEngine;
      if (doesInjectedWeb3Exist) {
        providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new InjectedWeb3Subprovider(injectedWeb3.currentProvider));
        providerEngine.addProvider(new FilterSubprovider());
        providerEngine.addProvider(new RedundantRPCSubprovider([constant.PUBLIC_NODE_URLS]));
        providerEngine.start();
      } else {
        providerEngine = new Web3ProviderEngine();
        providerEngine.addProvider(new FilterSubprovider());
        providerEngine.addProvider(new RedundantRPCSubprovider([constant.PUBLIC_NODE_URLS]));
        providerEngine.start();
      }

      this.web3 = new Web3(providerEngine);
      // Initialize 0x.js with the web3 current provider and provide it the network
      this.zeroEx = new ZeroEx(this.web3.currentProvider, { networkId: constant.NETWORK_ID });
      this.getCoinBase();
    }
    private static async _onPageLoadAsync(): Promise<void> {
        if (document.readyState === 'complete') {
            return; // Already loaded
        }
        return new Promise<void>((resolve, reject) => {
            window.onload = () => resolve();
        });
    }
    public async getCoinBase() {
        const addresses = await this.zeroEx.getAvailableAddressesAsync();
        const address = addresses[0];
        this._userAddress = address;
        return address;

    }
    public async getNetworkId(): Promise<any> {
      const injectedWeb3 = (window as any).web3;
      if (!_.isUndefined(injectedWeb3)) {
        try {
            return new Promise((resolve, reject) =>
                injectedWeb3.version.getNetwork((err, res) => {
              if (err) {
                  // reject(err);
                  console.log(err);
                  }
                  resolve(res);
              })
              );
        } catch (err) {
            // Ignore error and proceed with networkId undefined
            console.log(err);
        }
      }
    }
    private _doesUserAddressExist(): boolean {
      return this._userAddress !== '';
    }
    public async ensureAllowance(amount: BigNumber, tokenAddress: string): Promise<any> {
        const result = await this.isNecessaryToSetAllowance(amount, tokenAddress);
        if (result.needAllowance) {
            const takerAddress: string = this.web3.eth.coinbase;

            const tx = await this.zeroEx.token.setProxyAllowanceAsync(tokenAddress, takerAddress, amount);
            return this.zeroEx.awaitTransactionMinedAsync(tx);
        }
    }
    
    public async fillOrder(order: Order, takerAmount: BigNumber): Promise<any> {
        const takerAddress: string = this.web3.eth.coinbase;

        const txHash: string = await this.zeroEx.exchange.fillOrderAsync(this.convertToSignedOrder(order), takerAmount, true, takerAddress);
        return this.zeroEx.awaitTransactionMinedAsync(txHash);
    }

    public async getTokenSymbol(tokenAddress: string):  Promise<string> {
        const tokenReceived = (await this.zeroEx.tokenRegistry.getTokenIfExistsAsync(tokenAddress));
        if (tokenReceived == null) {return null; }
        if (tokenReceived.symbol === 'WETH') {return 'ETH'; }
        return tokenReceived.symbol;
    }

    public async isNecessaryToWrapETH(amount: BigNumber, tokenAddress: string): Promise< { needWrap: boolean, currentWrapped: BigNumber }> {
        const balance = await this.getBalanceToWrapETH(tokenAddress);
        if (balance) {
            return { needWrap : balance.lessThan(amount), currentWrapped: balance};
        }
        return { needWrap : false, currentWrapped: new BigNumber(0) };
    }

    public async isNecessaryToSetAllowance(amount: BigNumber, tokenAddress: string): Promise< { needAllowance: boolean, currentAllowance: BigNumber }> {
        const takerAddress: string = this.web3.eth.coinbase;
        const alowancedValue = await this.zeroEx.token.getProxyAllowanceAsync(tokenAddress, takerAddress);
        return { needAllowance: alowancedValue.comparedTo(amount) < 0, currentAllowance: alowancedValue };
    }


    private async getBalanceToWrapETH(address: string): Promise<BigNumber> {
        const tokenReceived = (await this.zeroEx.tokenRegistry.getTokenIfExistsAsync(address));
        const takerAddress: string = this.web3.eth.coinbase;
        if (!tokenReceived || tokenReceived.symbol !== 'WETH') {return undefined; }
        return await this.zeroEx.token.getBalanceAsync(await this.zeroEx.etherToken.getContractAddressIfExists(), takerAddress);
    }

    // Wrap Ether
    public async wrapETH(amount: BigNumber, address: string): Promise<any> {
        // const balance = await this.getEthBalance(address);
        const BASE_TOKEN_ADDRESS = await this.getTokenAddress(constant.BASE_TOKEN);
        const tx = await this.zeroEx.etherToken.depositAsync(BASE_TOKEN_ADDRESS, amount, address);
        // await this.zeroEx.awaitTransactionMinedAsync(tx);
        return tx;
  }
    // Unwrap Ether
    public async unwrapETH(amount: BigNumber, address: string): Promise<any> {
      const BASE_TOKEN_ADDRESS = await this.getTokenAddress(constant.BASE_TOKEN);
      const tx = await this.zeroEx.etherToken.withdrawAsync(BASE_TOKEN_ADDRESS, amount, address);
      // await this.zeroEx.awaitTransactionMinedAsync(tx);
      return tx;
    }

    private convertToSignedOrder(order: Order):  SignedOrder {
        const signedOrder: SignedOrder = {
                maker: order.maker,
                taker: order.taker,
                makerFee: new BigNumber(order.makerFee),
                takerFee: new BigNumber(order.takerFee),
                makerTokenAmount: new BigNumber(order.makerTokenAmount),
                takerTokenAmount: new BigNumber(order.takerTokenAmount),
                makerTokenAddress: order.makerTokenAddress,
                takerTokenAddress: order.takerTokenAddress,
                ecSignature: order.ecSignature,
                salt: new BigNumber(order.salt),
                exchangeContractAddress: order.exchangeContractAddress,
                expirationUnixTimestampSec: new BigNumber(order.expirationUnixTimestampSec),
                feeRecipient: order.feeRecipient
            };
        return signedOrder;
    }

    // Get User's Ether Balance
    public getEthBalance(address: string): Promise<BigNumber> {
        return new Promise((resolve, reject) =>
            this.web3.eth.getBalance(address, (err, res) => {
                if (err) {
                    // reject(err);
                    console.log(err);
                }
                resolve(res);
            })
        );
    }

    // Get Token Address By Token Symbol
    public async getTokenAddress(symbol: string): Promise<string> {
        if (symbol === 'ETH') {
            return await this.zeroEx.etherToken.getContractAddressIfExists();
        }
        const token: Token = await this.getToken(symbol);
        if (token) { return token.address; }
    }

    // Get Token Info By Token Symbol
    public async getToken(symbol: string): Promise<Token> {
        return await this.zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(symbol);
    }
    // Get Token Balance
    public async getBalanceAndAllowance(tokenSymbol: string, address: string): Promise<TokenStatus> {
      if (_.isEmpty(address)) {
        const tokenStatus = ({
          TokenBalance: 0,
          TokenAllowance: 0
        });
        return tokenStatus;
      }
      let tokenAllowStatus = ({
        TokenBalance: 0,
        TokenAllowance: 0
      });
      const tokenAddress = await this.getTokenAddress(tokenSymbol);
      
      if (_.isEmpty(tokenAddress)) {
        const tokenStatus = ({
          TokenBalance: 0,
          TokenAllowance: 0
        });
        return tokenStatus;
      }
      if (this._doesUserAddressExist()) {
        const allowance = await this.zeroEx.token.getProxyAllowanceAsync(tokenAddress, address);
        tokenAllowStatus = ({
          TokenBalance: this._renderAmount(await this.zeroEx.token.getBalanceAsync(tokenAddress, address), constant.DECIMAL_PLACES_ETH),
          TokenAllowance: allowance.toNumber()
        });
      }
      return tokenAllowStatus;
  }

  // Get Token Balance
  public async getEvotBalanceAndAllowance(address: string): Promise<TokenStatus> {
    if (_.isEmpty(address)) {
      const tokenStatus = ({
        TokenBalance: 0,
        TokenAllowance: 0
      });
      return tokenStatus;
    }
    let tokenAllowStatus = ({
      TokenBalance: 0,
      TokenAllowance: 0
    });
    const tokenAddress = constant.QUOTE_TOKEN;
    
    if (_.isEmpty(tokenAddress)) {
      const tokenStatus = ({
        TokenBalance: 0,
        TokenAllowance: 0
      });
      return tokenStatus;
    }
    if (this._doesUserAddressExist()) {
      const allowance = await this.zeroEx.token.getProxyAllowanceAsync(tokenAddress, address);
      tokenAllowStatus = ({
        TokenBalance: this._renderAmount(await this.zeroEx.token.getBalanceAsync(tokenAddress, address), constant.DECIMAL_PLACES_ETH),
        TokenAllowance: allowance.toNumber()
      });
    }
    return tokenAllowStatus;
  }

  // Get Token Balance by a token symbol
  public async getTokenBalance(tokenSymbol: string, ownerAddress: string) {
    const tokenAddress = await this.getTokenAddress(tokenSymbol);
    return await this.zeroEx.token.getBalanceAsync(tokenAddress, ownerAddress);
  }

  // Get evot Token Balance by a token symbol
  public async getEvotTokenBalance(ownerAddress: string) {
    const tokenAddress = constant.QUOTE_TOKEN;
    return await this.zeroEx.token.getBalanceAsync(tokenAddress, ownerAddress);
  }

  // Set Token Allowance
  public async setProxyAllowanceAsync(tokenAddr: string, isAllowance: Boolean): Promise<any> {
    let amountInBaseUnits = new BigNumber(0);
    if (!isAllowance) {
      amountInBaseUnits = DEFAULT_ALLOWANCE_AMOUNT_IN_BASE_UNITS;
    }
    const ownerAddr = this._userAddress;
    let tx = '';
    if (this._doesUserAddressExist()) {
      tx = await this.zeroEx.token.setProxyAllowanceAsync(tokenAddr, ownerAddr, amountInBaseUnits, { gasPrice: this._defaultGasPrice, });
      return await this.zeroEx.awaitTransactionMinedAsync(tx);
    }
  }

  // Convert BigNumber into Number
  public _renderAmount(amount: BigNumber, decimals: number) {
    const unitAmount = ZeroEx.toUnitAmount(amount, decimals);
    return Number(unitAmount.toNumber().toFixed(constant.PRECISION));
  }

  // Get Exchange Address
  public getExchangeAddress () {
    return this.zeroEx.exchange.getContractAddress();
  }

  // Fill Selected Order
  public async fillOrderAsync(order: SignedOrder, takerAmount: BigNumber, ownerAddr: string) {
    const fillTxHash = await this.zeroEx.exchange.fillOrderAsync(order, takerAmount, true, ownerAddr);
    return fillTxHash;
  }

  // Validate a given Order
  public async validateOrderFillableOrThrow(signedOrder: SignedOrder) {
    return await this.zeroEx.exchange.validateOrderFillableOrThrowAsync(signedOrder);
  }

  // Get user's Signature
  public async getECSignature(orderHash: string, ownerAddr: string) {
    return await this.zeroEx.signOrderHashAsync(orderHash, ownerAddr, true);
  }
  public async awaitTransactionMinedAsync(_txHash: string) {
    return await this.zeroEx.awaitTransactionMinedAsync(_txHash);
  }
  // Transfer token
  public async TransferTokenAsync(token: string, addressFrom: string, addressTo: string, amount: BigNumber) {
      const tokenInfo = await this.zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(token);
      const sendAmount = ZeroEx.toBaseUnitAmount(amount, tokenInfo.decimals);
      const curBalance = await this.getTokenBalance(token, addressFrom);
      const tx = await this.zeroEx.token.transferAsync(tokenInfo.address, addressFrom, addressTo, sendAmount);
      // await this.zeroEx.awaitTransactionMinedAsync(tx);
      return tx;
  }

  // Valid New Token and Register if new token is valid
  public async IsValidToken(_tokenName: string, _tokenSymbol: string, _tokenAddress: string, _tokenDecimal: number ) {
      const validToken = await this.zeroEx.tokenRegistry.getTokenIfExistsAsync(_tokenAddress.trim());
      if (validToken.name === _tokenName.trim()) {
        if (validToken.symbol === _tokenSymbol.trim()) {
          if (validToken.decimals === Number(_tokenDecimal)) {
            return true;
          }
         }
        }
      return false;
  }
}
