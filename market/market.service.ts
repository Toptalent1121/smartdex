import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, map, tap } from 'rxjs/operators';
import { constant } from '../config/constant';
import { Token } from '../config/token';
import { ChartData, TikerData } from '../config/market';
import { ZeroExService } from '../lib/zeroExService';
import { WebService } from '../lib/Web3Service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { MatSnackBar } from '@angular/material';
import { Web3ConfirmDialogComponent, AccountConfirmDialogComponent } from '../dialog/dialog.component';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
const Web3 = require('web3');
declare var web3;
import * as _ from 'lodash';
import { constants } from 'os';
import BigNumber from 'bignumber.js';
@Injectable()
export class MarketService {
  IsWeb3Support: Boolean;
  user_addr: String;
  networkID: number;

  constructor(
    @Inject(HttpClient) private http: HttpClient,
    @Inject(ZeroExService) private zeroExService: ZeroExService,
    @Inject(MatDialog) public dialog: MatDialog,
    public snackBar: MatSnackBar ) {}
  // Get Token List
  getToken() {
    const url = constant.API_URL + '/tokens';
    return this.http.get(url).toPromise()
            .then(response => response as any
            ).catch(err => {
              return err;
            });
  }
  getAllTokenList() {
    const url = constant.API_URL + '/tokens';
    return this.http.get(url).toPromise()
            .then(response => response as any
            ).catch(err => {
              return err;
            });
  }
  registerNewToken(
    _tokenName: string,
    _tokenSymbol: string,
    _tokenAddress: string,
    _tokenDecimal: number,
    _new_tknEmail: string,
    _new_tknWebsite: string,
    _new_tknVerifyLink: string,
    _new_tknAnnounceLink: string ) {
    const request = {
      name: _tokenName,
      symbol: _tokenSymbol,
      address: _tokenAddress,
      decimal: _tokenDecimal,
      userEmail: _new_tknEmail,
      tokenWebsite: _new_tknWebsite,
      tokenVerifyLink: _new_tknVerifyLink,
      tokenAnnounceLink: _new_tknAnnounceLink
    };
    const api = constant.API_URL + '/token/new';
    return this.http.post(api, request)
            .toPromise()
            .then(response => response as any[])
            .catch(err => {
              // console.log(err);
              return err;
            });
  }
  // getChartData(_quoteToken: string) {
  //   const ext_api = 'https://min-api.cryptocompare.com/data/histoday?fsym=' + _quoteToken + '&tsym=ETH&limit=100&aggregate=3&e=CCCAGG';
  //   console.log(ext_api);
  //   return this.http.get(ext_api)
  //           .toPromise()
  //           .then(response => response as ChartData[])
  //           .catch(err => {
  //             console.log(err);
  //             return err;
  //           });
  // }
  getChartData() {
    const url = constant.API_URL + '/getChartData';
    return this.http.get(url)
                    .toPromise()
                    .then(response => response as any);
  }

  getTradeHistoryAll(address: string) {
    const url = constant.API_URL + '/getTradeHistoryAll';
    const params = {
      myAddress: address
    };
    return this.http.post(url, params)
                    .toPromise()
                    .then(response => response as any);
  }
  getTransactionHistory(address: string) {
    const url = 'http://api.etherscan.io/api?module=account&action=txlist&address=' + address + '&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=' + constant.EtherscanAPI_KEY;
    return this.http.get(url)
    .toPromise()
    .then(response => response as any)
    .catch (err => {
      return err;
    });
  }
  getMyOrders(baseToken: string, quoteToken: string, address: string ) {
    const url = constant.API_URL + '/myOrders';
    const params = {
      baseTokenAddress: baseToken,
      quoteTokenAddress: quoteToken,
      myAddress: address
    };
    return this.http.post(url, params)
                    .toPromise()
                    .then(response => response as any);
  }

  getOrderBySalt(ordersalt: string) {
    const url = constant.API_URL + '/order/' + ordersalt;
    return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(err => {
              // console.log(err);
              return err;
            });
  }

  getBlocklists(address: string) {
    const url = constant.API_URL + '/getBlocklists?address=' + address;
    return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(err => {
              // console.log(err);
              return err;
            });
  }

  getExchangeMaxLimit() {
    const url = constant.API_URL + '/getExchangeMaxLimit';
    return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(err => {
              // console.log(err);
              return err;
            });
  }
  
  filledOrder(ordersalt: string, orderhash: string, fillMakerAmount: string, fillTakerAmount: string, order_status: number, taker: string) {
    const url = constant.API_URL + '/filledOrder';
    const params = {
      ordersalt: ordersalt,
      orderHash: orderhash,
      fillMakerAmount: fillMakerAmount,
      fillTakerAmount: fillTakerAmount,
      orderStatus: order_status,
      taker: taker
    };
    return this.http.post(url, params)
                    .toPromise()
                    .then(response => response as any);
  }

  filledPartialOrder(ordersalt: string, orderhash: string, fillMakerAmount: string, fillTakerAmount: string, maker: string, taker: string, makerTokenAddress: string, takerTokenAddress: string) {
    const url = constant.API_URL + '/filledPartialOrder';
    const params = {
      ordersalt: ordersalt,
      orderHash: orderhash,
      fillMakerAmount: fillMakerAmount,
      fillTakerAmount: fillTakerAmount,
      maker: maker, 
      taker: taker,
      makerTokenAddress: makerTokenAddress,
      takerTokenAddress: takerTokenAddress
    };
    return this.http.post(url, params)
                    .toPromise()
                    .then(response => response as any);
  }
  
  getTradeHistory(baseToken: string, quoteToken: string) {
    const url = constant.API_URL + '/getTradeHistory?baseTokenAddress=' + baseToken + '&quoteTokenAddress=' + quoteToken;
    return this.http.get(url).toPromise().then(response => response as any);
  }
  
  getTickerData(_token: string) {
    const url = 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=' + _token + '&tsyms=USD,ETH';
    return this.http.get(url)
              .toPromise()
              .then(response => response as any);
  }
  cancelOrder(order: any) {
    const url = constant.API_URL + '/cancelOrder';
    return this.http.post(url, order)
                    .toPromise()
                    .then(response => response as any);
  }

  getTickerDataFromServer() {
    const url = constant.API_URL + '/getTickerData';
    return this.http.get(url)
                    .toPromise()
                    .then(response => response as any);
  }

    // Snackbar
    public openSnackBar(message: string, action: string, data: string) {
      const snackBarRef = this.snackBar.open(message, action, {
        data: data,
        duration: 7000,
      });
      snackBarRef.afterDismissed().subscribe(() => {
        console.log('The snack-bar was dismissed');
      });
      snackBarRef.onAction().subscribe(() => {
        window.open(
          constant.AUDIT_TRANSACTION_URL + data,
          '_blank' // <- This is what makes it open in a new window.
        );
      });
    }
  checkWeb3Support() {
    let networkId;
    window.addEventListener('load', async function() {
     // Checking if Web3 has been injected by the browser (Mist/MetaMask)
      /*const injectedWeb3 = (window as any).web3;
      const doesInjectedWeb3Exist = !_.isUndefined(injectedWeb3);
      if (doesInjectedWeb3Exist) {
        // Use Mist/MetaMask's provider
        web3 = new Web3(injectedWeb3.currentProvider);
      } else {
        console.log('No web3? You should consider trying MetaMask!');
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        web3 = new Web3(new Web3.providers.HttpProvider(constant.PUBLIC_NODE_URLS));
      }*/

      let injectedProviderIfExists = (window as any).ethereum;
        if (!_.isUndefined(injectedProviderIfExists)) {
            if (!_.isUndefined(injectedProviderIfExists.enable)) {
                try {
                    await injectedProviderIfExists.enable();
                } catch (err) {
                    console.log(err);
                }
            }
        } else {
            const injectedWeb3IfExists = (window as any).web3;
            if (!_.isUndefined(injectedWeb3IfExists) && !_.isUndefined(injectedWeb3IfExists.currentProvider)) {
                injectedProviderIfExists = injectedWeb3IfExists.currentProvider;
            } else {
                return undefined;
            }
        }

      // injectedProviderIfExists.version.getNetwork((err, netId) => {
      //   networkId = netId;
      //   switch (netId) {
      //     case '1':
      //       console.log('This is the main network.');
      //       break;
      //     case '3':
      //       console.log('This is the ropsten test network.');
      //     case '42':
      //       console.log('This is the test network.');
      //       break;
      //     default:
      //       console.log('This is Unknown network.');
      //       break;
      //   }
      // });

      const networkId = await new Web3Wrapper(injectedProviderIfExists).getNetworkIdAsync();
      switch (networkId) {
        case 1:
          console.log('This is the main network.');
          break;
        case 3:
          console.log('This is the ropsten test network.');
        case 42:
          console.log('This is the kovan test network.');
          break;
        default:
          console.log('This is Unknown network.');
          break;
      }

      let account = web3.eth.accounts[0];
      setInterval(function() {
        if (web3.eth.accounts[0] !== account) {
          account = web3.eth.accounts[0];
          window.location.reload();
        }
      }, 100);
    });
  }

}
