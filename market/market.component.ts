import {
  FeesRequest,
  FeesResponse,
  TokenPairsItem,
  OrderbookResponse,
  OrderbookRequest,
  SignedOrder
} from '@0xproject/connect';
import { Order } from '../config/order';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { constant } from '../config/constant';
import { Token, TokenStatus} from '../config/token';
import { ECSignature } from '../config/ecSignature';
import { ChartData, TikerData } from '../config/market';
import { MarketService } from './market.service';
import { WebService } from '../lib/Web3Service';
import { ZeroExService } from '../lib/zeroExService';
import { OrderService } from '../lib/OrderService';
import { BigNumber } from 'bignumber.js';
import { ZeroEx } from '0x.js';
import { catchError, map, tap } from 'rxjs/operators';
import { FormControl, Validators } from '@angular/forms';
import { NgSwitch } from '@angular/common';
import { Ng4LoadingSpinnerModule, Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { MatSnackBar } from '@angular/material';
import { MAT_SNACK_BAR_DATA } from '@angular/material';
import { Web3ConfirmDialogComponent, AccountConfirmDialogComponent, ConvertEthComponent, MessageArchivedComponent, DialogWhenSnackBarViewed } from '../dialog/dialog.component';
import { constants } from 'os';
import { MatInputModule, MatPaginatorModule, MatProgressSpinnerModule, MatSortModule, MatTableModule } from '@angular/material';

import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
// import am4themes_frozen from "@amcharts/amcharts4/themes/frozen";
import am4themes_animated from "@amcharts/amcharts4/themes/frozen";
import am4themes_material from "@amcharts/amcharts4/themes/material";
am4core.useTheme(am4themes_material);
am4core.useTheme(am4themes_animated);
// am4core.useTheme(am4themes_frozen);

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/map';
import * as _ from 'lodash';
import { rgb } from '@amcharts/amcharts4/.internal/core/utils/Colors';
@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.css']
})

export class MarketComponent implements OnInit, OnDestroy {
  public color = 'accent';
  public coinbase: string;
  public netWorkID: number;
  public etherscan_url = constant.AUDIT_TRANSACTION_URL;
  public BaseToken = constant.BASE_TOKEN;
  public BaseTokenStatus: TokenStatus;
  public quoteTokenStatus: TokenStatus;
  public quoteToken: string;
  public orderBids: Array<any>;
  public orderAsks: Array<any>;
  public QuoteTokenInfo: Token;
  public selectedBidOrder: Order;
  public selectedAskOrder: Order;
  public MarketHistory: Array<any>;
  public myActiveOrders: Array<any>;
  public myHistoryOrders: Array<any>;
  public tickerData: TikerData;
  public Tokenlists: any;
  public TokenlistsWthTicker = [];
  public etherBalance;
  public bestRate: any;
  public market24hChange;
  public market24hHigh;
  public market24hLow;
  public market24hVolume;
  public priceToUSD;
  public priceToEth;
  public is24hHighUp;
  public is24hLowUp;
  public is24hVolumeUp;
  public is24hChangeUp;
  public is24hChangeLessThanZero;
  public isUSDUp;
  public isEthUp;
  public checked = false;
  public disabled = false;
  public isErr = false;
  public isConverting = false;
  public isGettingtickerdata = false;
  public isGettingOrderbook = false;
  public isGettingMyOrder = false;
  public isGettingMyOrderHistory = false;
  public isGettingTradehistory = false;
  public isProcessingAllowanceBaseToken = false;
  public isProcessingAllowanceQuoteToken = false;
  public isCreatingSellOrder = false;
  public isCreatingBuyOrder = false;
  public errMsgBUY: string;
  public errMsgSELL: string;
  public errMsg;
  public spread;
  public selected_buy;
  public selected_sell;
  public fee = constant.FEE;
  public isRegisteringToken = false;
  public isErrRegisterNewToken = false;
  public searchResult;
  public ticker_market24hVolume;
  public ticker_lastPrice;
  public ticker_lastBid;
  public ticker_lastAsk;
  public actionBUY = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public actionSELL = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public ordersaltBUY = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public ordersaltSELL = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public AmountBUY = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public AmountSELL = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public PriceBUY = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public PriceSELL = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public ExpireDateBUY = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public ExpireDateSELL = new FormControl({Value: '', disabled: true}, [Validators.required]);
  public new_token_name = new FormControl('', [Validators.required]);
  public new_token_website = new FormControl('', [Validators.required]);
  public token_email = new FormControl('', [Validators.required]);
  public token_verify_url = new FormControl('', [Validators.required]);
  public token_announce_url = new FormControl('', [Validators.required]);
  public new_token_symbol = new FormControl('', [Validators.required]);
  public new_token_address = new FormControl('', [Validators.required]);
  public new_token_decimal = new FormControl('', [Validators.required]);
  public searchTerm = new FormControl('', [Validators.required]);
  public accept_terms = new FormControl('', [Validators.required]);
  // private chart: AmChart;
  // private chDataProvider: Array<any>;
  public ethUsdPrice: any;
  public currentEvotPrice = 0.55;
  private chart: am4charts.XYChart;
  public total_bids: any;
  public total_asks: any;
  public minDate: any;

  constructor(
    private route: ActivatedRoute,
    // private AmCharts: AmChartsService,
    private marketService: MarketService,
    private zeroExService: ZeroExService,
    private orderService: OrderService,
    private ng4LoadingSpinnerService: Ng4LoadingSpinnerService,
    private http: HttpClient,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    meta: Meta,
    title: Title,
    private zone: NgZone
  ) {
    // Sets the <title></title>
    title.setTitle('EVOAI Exchange');

    // Sets the <meta> tag for the page
    meta.addTags([
      { name: 'author', content: 'Crypto' },
      { name: 'description', content: 'This is the marketplace of 0x protocol based Decentralized Exchange platform. default market: weth-zrx' },
    ]);
    this.marketService.checkWeb3Support();
    this.searchTerm.valueChanges
        .debounceTime(400)
        .subscribe(data => {
            this.searchResult = _.pickBy(this.TokenlistsWthTicker, function(value, key) {
              console.log('value', value);
              console.log('key', key);
              return _.startsWith(key, data);
            });
        });
  }

 ngOnInit() {
    // subscribe to the parameters observable
      this.route.params.subscribe(params => {
        // Firt of all, all arguments initializing....
      this.quoteToken = params.quoteToken;
      this.selected_buy = 'LIMIT';
      this.selected_sell = 'LIMIT';
      this.startLoadingSpinner();
      this._getNetworkID();
      this.AmountSELL.setValue('0.0000');
      this.AmountBUY.setValue('0.0000');
      this.PriceBUY.setValue('0.0000');
      this.PriceSELL.setValue('0.0000');
      this.isErr = false;
      this.errMsgBUY = '';
      this.errMsgSELL = '';
      this.market24hChange = 0;
      this.market24hHigh = 0;
      this.market24hLow = 0;
      this.market24hVolume = 0;
      this.minDate = new Date();
      this.minDate.setDate(this.minDate.getDate() + 1);
      // this.chDataProvider = [];
      this.orderAsks = [];
      this.orderBids = [];
      this.checked = false;
     // this.getTokenlists();
     this.getTickerData();
      this.getUserInfo();
      this.getEtherBalance();
      this.drawChart();
      this.getOrderBook();
      this.getMyOrders();
      this.getMarketHistory();
      this.getEthUsdPrice();
      // this.ng4LoadingSpinnerService.hide();
    });
    // this.checkWeb3();
  }
  ngOnDestroy() {

    // Cleanup chartdiv2
    this.zone.runOutsideAngular(() => {
      if (this.chart) {
        this.chart.dispose();
      }
    });
    this.AmountBUY.setValue(0);
    this.AmountSELL.setValue(0);
    this.PriceBUY.setValue(this.bestRate);
    this.PriceSELL.setValue(this.bestRate);
    this.actionBUY.setValue('');
    this.actionSELL.setValue('');
    this.ExpireDateBUY.setValue(' ');
    this.ExpireDateSELL.setValue(' ');
    this.AmountBUY.enable();
    this.AmountSELL.enable();
    this.PriceBUY.enable();
    this.PriceSELL.enable();
    this.ExpireDateBUY.enable();
    this.ExpireDateSELL.enable();
  }

  public getEthUsdPrice() {
    this.http.get('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=XT1TNTQ6NWDKJDVB76FIGWQU2VAJHEKTYV').subscribe(data => this.ethUsdPrice = data['result']['ethusd']);
  }

  public startLoadingSpinner() {
    this.ng4LoadingSpinnerService.show();

    setTimeout(function() {
      this.ng4LoadingSpinnerService.hide();
    }.bind(this), 2000);
  }
  private async _getNetworkID() {
      const netID = await this.zeroExService.getNetworkId();
      this.netWorkID = parseInt(netID, 10);
      // console.log(this.netWorkID);
      if (!this.netWorkID) {
        this.openAccountAlertDialog('err_web3');
        return;
      } else if (this.netWorkID !== 1) {
        if (this.netWorkID !== 42) {
          this.openAccountAlertDialog('err_network');
          return;
        }
      }
  }
  public async getEtherBalance() {
    try {
      this.coinbase = await this.zeroExService.getCoinBase();
      let balance;
      if (this.coinbase) {
        balance = await this.zeroExService.getEthBalance(this.coinbase);
        balance = new BigNumber(balance);
        this.etherBalance = ZeroEx.toUnitAmount(balance, 18).toNumber();
      }
    } catch (e) {
      console.log(e);
    }

  }

  // Get Token List supported by relayer
  public async getTokenlists() {
    try {
      this.Tokenlists = await this.marketService.getToken();
    } catch (e) {
      console.log(e);
    }
  }

  // Get Chart Data
  public async getChartData() {
    let chDataProvider: any;
    // const  tokenAddr = await this.zeroExService.getTokenAddress(this.quoteToken);
    // const  basetokenAddr = await this.zeroExService.getTokenAddress(this.BaseToken);
    if (this.quoteToken) {
      chDataProvider = await this.marketService.getChartData();
      return chDataProvider;
      // console.log(chDataProvider);
      // if (chDataProvider.Response === 'Success') {
      //   return chDataProvider.Data;

      // }
    }
  }

  // Get OrderBook
  public async getOrderBook() {
    this.isGettingOrderbook = true;
    this.orderAsks = [];
    this.orderBids = [];
    let orderBook: OrderbookResponse;
    setInterval( async() => {
      try {
          const quoteTokenAddress = constant.QUOTE_TOKEN;
          const BASE_TOKEN_ADDRESS = await this.zeroExService.getTokenAddress(this.BaseToken);
          if (quoteTokenAddress) {
            const orderRequest: OrderbookRequest = {
            baseTokenAddress: BASE_TOKEN_ADDRESS,
            quoteTokenAddress: quoteTokenAddress,
          };
          orderBook = await this.orderService.getOrderBook(orderRequest);
          if (orderBook) {
            this.orderAsks = orderBook.asks;
            this.orderBids = orderBook.bids;
            this.isGettingOrderbook = false;
            let ask_total = 0;
            for (let i = 0; i < orderBook.asks.length; i++) {
              ask_total += +orderBook.asks[i]['remainedMakerTokenAmount'];
            }
            
            let bid_total = 0;
            for (let j = 0; j < orderBook.bids.length; j++) {
              bid_total += (+orderBook.bids[j]['remainedMakerTokenAmount'] / 10**18);
            }
            this.total_asks = (ask_total / 10**18).toFixed(3);
            this.total_bids = (bid_total).toFixed(5);
          } else {
            this.isGettingOrderbook = false;
          }
        }
      } catch (e) {
        console.log(e);
        this.isGettingOrderbook = false;
      }
      this.isGettingOrderbook = false;
      this.getSpread();
    }, 5000);

  }

  public calculateBestRate(_type: string) {
    // Find Best Order and Calculate the best Rate
    // Because we are looking to exchange our ZRX for WETH, we get the bids side of the order book and sort the orders with the best rate first
    let rates;
    // if (this.orderAsks.length >= 1) {
    //     const sortedBids = this.orderBids.sort((orderA, orderB) => {
    //       const orderRateA = new BigNumber(orderA.makerTokenAmount).div(new BigNumber(orderA.takerTokenAmount));
    //       const orderRateB = new BigNumber(orderB.makerTokenAmount).div(new BigNumber(orderB.takerTokenAmount));
    //       return orderRateB.comparedTo(orderRateA);
    //     });
    //     // Calculate and print out the WETH/ZRX exchange rate for each order
    //       rates = sortedBids.map(order => {
    //       const rate = new BigNumber(order.makerTokenAmount).div(new BigNumber(order.takerTokenAmount));
    //       // return rate.toString() + ' WETH/' + constant.QUOTE_TOKEN;
    //       return rate.toString();
    //     });
    // console.log('Calculating buy orders...');
    // } else if (this.orderBids.length >= 1) {
    //     const sortedAsks = this.orderAsks.sort((orderA, orderB) => {
    //     const orderRateA = new BigNumber(orderA.takerTokenAmount).div(new BigNumber(orderA.makerTokenAmount));
    //     const orderRateB = new BigNumber(orderB.takerTokenAmount).div(new BigNumber(orderB.makerTokenAmount));
    //     return orderRateB.comparedTo(orderRateA);
    //   });
    //   // Calculate and print out the WETH/ZRX exchange rate for each order
    //   rates = sortedAsks.map(order => {
    //     const rate = new BigNumber(order.takerTokenAmount).div(new BigNumber(order.makerTokenAmount));
    //     // return rate.toString() + ' WETH/' + constant.QUOTE_TOKEN;
    //     return rate.toString();
    //   });
    //   console.log('Calculating sell orders...');
    // } else {
    //   // console.log(this.priceToEth);
    //   // rates = this.priceToEth;
    //   rates = this.currentEvotPrice / this.ethUsdPrice;
    // }
    rates = this.currentEvotPrice / this.ethUsdPrice;   
    // console.log(this.bestRate);
    if (_type === 'BUY') {
      if(this.orderAsks[0]) {
        this.bestRate = (this.orderAsks[0]['remainedTakerTokenAmount'] / this.orderAsks[0]['remainedMakerTokenAmount']).toFixed(5);
      } else {
        this.bestRate = rates.toFixed(5);
      }
      this.PriceBUY.setValue(this.bestRate);
    } else {
      if(this.orderBids[0]) {
        this.bestRate = (this.orderBids[0]['remainedMakerTokenAmount'] / this.orderBids[0]['remainedTakerTokenAmount']).toFixed(5);
      } else {
        this.bestRate = rates.toFixed(5);  
      }
      this.PriceSELL.setValue(this.bestRate);
    }
  }

  // Calculate Spread
  public async getSpread() {
    let avgBidprice;
    let avgAskprice;
    let totalBidPrice = 0;
    let totalAskPrice = 0;
    if (this.orderAsks.length > 0) {
      for (let i = 0; i < this.orderAsks.length; i++) {
        totalAskPrice += Number(this.orderAsks[i].takerTokenAmount / this.orderAsks[i].makerTokenAmount);
      }
      avgAskprice = totalAskPrice / this.orderAsks.length;
    }
    if (this.orderBids.length > 0) {
      for (let i = 0; i < this.orderBids.length; i++) {
        totalBidPrice += Number(this.orderBids[i].makerTokenAmount / this.orderBids[i].takerTokenAmount);
      }
      avgBidprice = totalBidPrice / this.orderBids.length;
    }
    if (avgAskprice && avgBidprice) {
      this.spread = avgAskprice - avgBidprice;
    } else {
      this.spread = 0.000001;
    }
  }
  // Get My active orders and history

  public async getMyOrders() {
    try {
      let myOrders: any;
      this.isGettingMyOrder = true;
      this.isGettingMyOrderHistory = true;
      const quoteTokenAddress = constant.QUOTE_TOKEN;
      const BASE_TOKEN_ADDRESS = await this.zeroExService.getTokenAddress(this.BaseToken);
      const myAddress = await this.zeroExService.getCoinBase();
      if (myAddress && quoteTokenAddress) {
         const baseTokenAddress = BASE_TOKEN_ADDRESS;
         myOrders = await this.marketService.getMyOrders(baseTokenAddress, quoteTokenAddress, myAddress);
         this.myActiveOrders = myOrders.active;
         this.isGettingMyOrder = false;
         this.myHistoryOrders = myOrders.history;
         this.isGettingMyOrderHistory = false;
        //  console.log(activeOrders);
      }
    } catch (e) {
      console.log(e);
    }
  }

  // Get Market Trade History
  public async getMarketHistory() {
    try {
      this.isGettingTradehistory = true;
      const quoteTokenAddress = constant.QUOTE_TOKEN;
      const BASE_TOKEN_ADDRESS = await this.zeroExService.getTokenAddress(this.BaseToken);
      if (quoteTokenAddress) {
        const basetokenAddr = BASE_TOKEN_ADDRESS;
        const history = await this.marketService.getTradeHistory(basetokenAddr, quoteTokenAddress);
        if (history) {
          this.MarketHistory = history;
          this.isGettingTradehistory = false;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  // Get User Balance
  public async getUserInfo() {
    this.isProcessingAllowanceBaseToken = true;
    this.isProcessingAllowanceQuoteToken = true;
    this.BaseTokenStatus = ({
      TokenBalance: 0,
      TokenAllowance: 0
    });
    this.quoteTokenStatus = ({
      TokenBalance: 0,
      TokenAllowance: 0
    });
    this.coinbase = await this.zeroExService.getCoinBase();
    if (this.coinbase) {
      try {
        this.BaseTokenStatus = await this.zeroExService.getBalanceAndAllowance(constant.BASE_TOKEN, this.coinbase);
        this.isProcessingAllowanceBaseToken = false;
        this.quoteTokenStatus = await this.zeroExService.getEvotBalanceAndAllowance(this.coinbase);
        this.isProcessingAllowanceQuoteToken = false;
      } catch (e) {
        this.isProcessingAllowanceBaseToken = false;
        this.isProcessingAllowanceQuoteToken = false;
        console.log(e);
      }
    }

  }

  // Function for SetProxyAllowance
  public async onAllowanceChange(event): Promise<any> {
    event.target.checked = !event.target.checked;
    let tokenAddr;
    let token;
    let tx;
    let isAllowance;
    token = event.target.id;
    if (token === this.BaseToken) {
      this.isProcessingAllowanceBaseToken = true;
    } else if ( token === this.quoteToken) {
      this.isProcessingAllowanceQuoteToken = true;
    }
    tokenAddr = await this.zeroExService.getTokenAddress(token);
    isAllowance = event.target.checked;
    try {
      tx = await this.zeroExService.setProxyAllowanceAsync(tokenAddr, isAllowance);
      if (tx.status === 1) {
        event.target.checked = !event.target.checked;
        await this.getUserInfo();
      }
    } catch (e) {
      console.log(e);
    }
    this.isProcessingAllowanceQuoteToken = false;
    this.isProcessingAllowanceBaseToken = false;
  }

  // Function for SetProxyAllowance
  public async onAllowanceChangeEvot(event): Promise<any> {
    event.target.checked = !event.target.checked;
    let tokenAddr;
    let token;
    let tx;
    let isAllowance;
    token = event.target.id;
    if (token === this.BaseToken) {
      this.isProcessingAllowanceBaseToken = true;
    } else if ( token === this.quoteToken) {
      this.isProcessingAllowanceQuoteToken = true;
    }
    tokenAddr = constant.QUOTE_TOKEN;
    isAllowance = event.target.checked;
    try {
      tx = await this.zeroExService.setProxyAllowanceAsync(tokenAddr, isAllowance);
      if (tx.status === 1) {
        event.target.checked = !event.target.checked;
        await this.getUserInfo();
      }
    } catch (e) {
      console.log(e);
    }
    this.isProcessingAllowanceQuoteToken = false;
    this.isProcessingAllowanceBaseToken = false;
  }

    // Function for SetProxyAllowance
    public async onChangeBuyOrSell(event): Promise<any> {
      // alert(event.checked);
      this.checked = event.checked;
    }

  // Select an Order from OrderBook
  public async sel_order(type: string, order: Order) {
    const takerTokenInfo = {decimals: 18};
    let sel_price: any;
    // if (this.selectedBidOrder) {
    //   return;
    // }
    this.selectedBidOrder = order;
    //console.log(this.selectedBidOrder.makerTokenAmount);
    if (type === 'bids') {
      // this.PriceSELL.disable();
      // this.AmountSELL.disable();
      // this.ExpireDateSELL.disable();
      // this.buytab.click();
      // const makerTokenInfo = await this.zeroExService.getToken(this.BaseToken);
      if (takerTokenInfo) {
        this.actionSELL.setValue('filled');
        sel_price = (Number(this.selectedBidOrder.remainedMakerTokenAmount) / Number(this.selectedBidOrder.remainedTakerTokenAmount)).toFixed(5);
        this.ordersaltSELL.setValue(order.salt);
        this.AmountSELL.setValue(ZeroEx.toUnitAmount(new BigNumber(order.remainedTakerTokenAmount), takerTokenInfo.decimals).toFixed(5));
        this.PriceSELL.setValue(sel_price);
        this.ExpireDateSELL.setValue(new Date(Number(order.expirationUnixTimestampSec) * 1000));
      }

    } else if (type === 'asks') {
      // this.PriceBUY.disable();
      // this.AmountBUY.disable();
      // this.ExpireDateBUY.disable();
      if (takerTokenInfo) {
        sel_price = (Number(this.selectedBidOrder.remainedTakerTokenAmount) / Number(this.selectedBidOrder.remainedMakerTokenAmount)).toFixed(5);
        this.actionBUY.setValue('filled');
        this.ordersaltBUY.setValue(order.salt);
        this.AmountBUY.setValue(ZeroEx.toUnitAmount(new BigNumber(order.remainedMakerTokenAmount), takerTokenInfo.decimals).toFixed(5));
        this.PriceBUY.setValue(sel_price);
        this.ExpireDateBUY.setValue(new Date(Number(order.expirationUnixTimestampSec) * 1000));
      }
    }
  }
  getErrorMessage(type: string) {
    if (type === 'amountBUY') {
      return this.AmountBUY.hasError('required') ? 'Input an amount value' : '';
    }
    if (type === 'amountSELL') {
      return this.AmountSELL.hasError('required') ? 'Input an amount value' : '';
    }
    if (type === 'priceBUY') {
      return this.PriceBUY.hasError('required') ? 'Input an amount value' : '';
    }
    if (type === 'priceSELL') {
      return this.PriceSELL.hasError('required') ? 'Input an amount value' : '';
    }
    if (type === 'dateBUY') {
      return this.ExpireDateBUY.hasError('required') ? 'You must choose expiration date' : '';
    }
    if (type === 'dateSELL') {
      return this.ExpireDateSELL.hasError('required') ? 'You must choose expiration date' : '';
    }

  }

  public multdec (val1: number, val2: number ) {
    return ( val1 * 10 * val2 * 10 ) / 10;
  }

  // Create or fill Order
  async createOrder(type: string) {
    
    let makerTokenAddress;
    let takerTokenAddress;
    let makerTokenAmount;
    let takerTokenAmount;
    let EXCHANGE_ADDRESS;
    let feesResponse: FeesResponse;
    this.isErr = false;
    this.errMsgBUY = '';
    this.errMsgSELL = '';

    EXCHANGE_ADDRESS = this.zeroExService.getExchangeAddress();

      if (type === 'buy') {
        const blocklists = await this.marketService.getBlocklists(this.coinbase);
        if (blocklists[0]['qtt'] > 0 ) {
          this.isErr = true;
          this.errMsgBUY = 'You are not permitted.';
          this.cleanOrdertiker('BUY');
          return;
        }

        this.isCreatingBuyOrder = true;
        const action = this.actionBUY.value;
        const makerTokenAllowanceStatus = this.BaseTokenStatus.TokenAllowance;
        // console.log(makerTokenAllowanceStatus);
        if (!makerTokenAllowanceStatus) {
          this.isErr = true;
          this.errMsgBUY = 'You must set ' + this.BaseToken + ' Token allowance';
          this.cleanOrdertiker('BUY');
          return;
        }
        const takerTokenAllowanceStatus = this.quoteTokenStatus.TokenAllowance;
        // console.log(takerTokenAllowanceStatus);
        if (!takerTokenAllowanceStatus) {
          this.isErr = true;
          this.errMsgBUY = 'You must set ' + this.quoteToken + ' Token allowance';
          this.cleanOrdertiker('BUY');
          return;
        }
        const temp_amount1 = new BigNumber(
          (
            Number(this.PriceBUY.value) * Number(this.AmountBUY.value)
          ).toFixed(15)
        );
        const amount1 = ZeroEx.toBaseUnitAmount(temp_amount1, constant.DECIMAL_PLACES_ETH);
        if (Number(amount1) <= 0) {
          this.isErr = true;
          this.errMsgBUY = 'Amount cannot be empty';
          this.cleanOrdertiker('BUY');
          return;
        }
        if (Number(this.PriceBUY.value) <= 0) {
          this.isErr = true;
          this.errMsgBUY = 'Amount cannot be empty';
          this.cleanOrdertiker('BUY');
          return;
        }
        if (Number(this.AmountBUY.value) <= 0) {
          this.isErr = true;
          this.errMsgBUY = 'Amount cannot be empty';
          this.cleanOrdertiker('BUY');
          return;
        }

        const amount2 = ZeroEx.toBaseUnitAmount(new BigNumber(this.AmountBUY.value), constant.DECIMAL_PLACES_ETH);
        if (Number(amount2) < 0) {
          this.isErr = true;
          this.errMsgBUY = 'Amount cannot be empty';
          this.cleanOrdertiker('BUY');
          return;
        }
        const expireUnixtime = new BigNumber(this.ExpireDateBUY.value.getTime() / 1000);
        if (!expireUnixtime) {
          this.isErr = true;
          this.errMsgBUY = 'Expiration date cannot be empty';
          this.cleanOrdertiker('BUY');
          return;
        }
        makerTokenAddress = await this.zeroExService.getTokenAddress(this.BaseToken);
        takerTokenAddress = constant.QUOTE_TOKEN;
        makerTokenAmount = amount1;
        takerTokenAmount = amount2;
        const AvailablemakerTokenAmount = await this.zeroExService.getTokenBalance(this.BaseToken, this.coinbase);
        if ( Number(AvailablemakerTokenAmount) < Number(makerTokenAmount)) {
          this.isErr = true;
          this.errMsgBUY = 'Insufficient ' + this.BaseToken + ' Balance';
          this.cleanOrdertiker('BUY');
          return;
        }
        if (EXCHANGE_ADDRESS) {
          if (action === 'filled') {
            const orderSalt = this.ordersaltBUY.value;
            try {
              const order = await this.marketService.getOrderBySalt(orderSalt.toString());
              // console.log(order.takerTokenAmount);
              // console.log(takerTokenAmount.toString());
              // console.log(makerTokenAmount.toString());
              const ecSignature = {
                r: (order.ecSignature.r).toString(),
                s: (order.ecSignature.s).toString(),
                v: Number(order.ecSignature.v)
              };
              const orderhash = ZeroEx.getOrderHashHex(order);
              const orderToFill: SignedOrder = {
                ecSignature: ecSignature,
                exchangeContractAddress: order.exchangeContractAddress,
                expirationUnixTimestampSec: new BigNumber(order.expirationUnixTimestampSec),
                feeRecipient: order.feeRecipient,
                maker: order.maker,
                makerFee: new BigNumber(order.makerFee),
                makerTokenAddress: order.makerTokenAddress,
                makerTokenAmount: new BigNumber(order.makerTokenAmount),
                salt: order.salt,
                taker: order.taker,
                takerFee: new BigNumber(order.takerFee),
                takerTokenAddress: order.takerTokenAddress,
                takerTokenAmount: new BigNumber(order.takerTokenAmount)
              };
              
              if (ZeroEx.isValidSignature(orderhash, orderToFill.ecSignature, orderToFill.maker)) {
                console.log('is valid order');
              } else {
                console.log('is invalid order');
              }
              
              const fillMakerAmount = new BigNumber(+this.AmountBUY.value * 10**18);
              const takerAmount= document.getElementById('buy_totalweth').innerText;
              const a = +takerAmount.toString();
              const b = a.toString().split('.');
              const c = b[1];
              let d;
              let e;
              if(c) {
                d = c.length;
                e = +c;
              }    
              let fillTakerAmount;
              if (b[0] === '0') 
                fillTakerAmount = new BigNumber(this.multdec(e, 10**(18 - d)));
              else 
                fillTakerAmount = new BigNumber(this.multdec(+takerAmount, 10**18));
              let order_status = 0;
              if(+order.remainedTakerTokenAmount <= +fillTakerAmount.toString()) {
                console.log('full filled');
                order_status = 1;
              } else {
                console.log('partially filled');
                order_status = 0;
              }      
              
              const fillTxHash = await this.zeroExService.fillOrderAsync(orderToFill, fillTakerAmount, this.coinbase);
              const log = await this.zeroExService.awaitTransactionMinedAsync(fillTxHash);
              if (log.status === 1) {
                const result = await this.marketService.filledOrder(order.salt, fillTxHash, fillMakerAmount.toString(), fillTakerAmount.toString(), order_status, this.coinbase);
                if (order_status == 1) {
                  if (result.state === 'ok') {
                    this.openSnackBar('An order was filled successfully. For Etherscan verification, click', 'here', fillTxHash);
                    this.getMyOrders();
                    this.getMarketHistory();
                    this.cleanOrdertiker('BUY');
                    return;
                  } else {
                    this.isErr = true;
                    this.errMsgBUY = 'Could not fill the order. Network error';
                    this.cleanOrdertiker('BUY');
                  }
                } else {
                  if (result.state === 'ok') {
                    const insert_result = await this.marketService.filledPartialOrder(order.salt, fillTxHash, fillMakerAmount.toString(), fillTakerAmount.toString(), order.maker, this.coinbase, order.makerTokenAddress, order.takerTokenAddress);
                    if (insert_result.state === 'ok') {
                      this.openSnackBar('An order was filled successfully. For Etherscan verification, click', 'here', fillTxHash);
                      this.getMyOrders();
                      this.getMarketHistory();
                      this.cleanOrdertiker('BUY');
                      return;
                    } else {
                      this.isErr = true;
                      this.errMsgBUY = 'Could not fill the order. Network error';
                      this.cleanOrdertiker('BUY');
                    }
                  } else {
                    this.isErr = true;
                    this.errMsgBUY = 'Could not fill the order. Network error';
                    this.cleanOrdertiker('BUY');
                  }
                }
                
              } else {
                this.isErr = true;
                this.errMsgBUY = 'Unfortunately, Could not fill the order';
                this.cleanOrdertiker('BUY');
              }
            } catch (e) {
              console.log(e);
              this.cleanOrdertiker('BUY');
            }
          } else {
            try {
              const feesRequest: FeesRequest = {
                exchangeContractAddress: EXCHANGE_ADDRESS,
                maker: this.coinbase,
                taker: ZeroEx.NULL_ADDRESS,
                makerTokenAddress: makerTokenAddress,
                takerTokenAddress: takerTokenAddress,
                makerTokenAmount,
                takerTokenAmount,
                expirationUnixTimestampSec: expireUnixtime,
                salt: ZeroEx.generatePseudoRandomSalt(),
              };
              feesResponse = await this.orderService.getFeesAsync(feesRequest);
              // console.log(feesResponse);
              // return;
              const order: any = {
                ...feesRequest,
                ...feesResponse
              };
              const orderHash = ZeroEx.getOrderHashHex(order);
              const ecSignature = await this.zeroExService.getECSignature(orderHash, this.coinbase);
              if (ecSignature) {
                const signedOrder: any = {
                  ...order,
                  ecSignature
                };
                const validate = this.zeroExService.validateOrderFillableOrThrow(signedOrder);
                if (validate) {
                  await this.orderService.SubmitOrder(signedOrder);
                  this.openSnackBar('A New Order created', '', '');
                  this.getMyOrders();
                  this.cleanOrdertiker('BUY');
                } else {
                  this.isErr = true;
                  this.errMsgBUY = 'Cannot create your order';
                  this.cleanOrdertiker('BUY');
                  return;
                }
              } else {
                this.isErr = true;
                this.errMsgBUY = 'Cannot create your order';
                this.cleanOrdertiker('BUY');
                return;
              }
            } catch (e) {
              console.log(e);
              this.isErr = true;
                this.errMsgBUY = 'API SERVER ERROR';
                this.cleanOrdertiker('BUY');
                return;
            }
          }
        }
      } else if (type === 'sell') {
        // check if current user is not block list
        const blocklists = await this.marketService.getBlocklists(this.coinbase);
        if (blocklists[0]['qtt'] > 0 ) {
          this.isErr = true;
          this.errMsgSELL = 'You are not permitted.';
          this.cleanOrdertiker('SELL');
          return;
        }

        this.isCreatingSellOrder = true;
        const action = this.actionSELL.value;
        const makerTokenAllowanceStatus = this.BaseTokenStatus.TokenAllowance;
        // console.log(makerTokenAllowanceStatus);
        if (!makerTokenAllowanceStatus) {
          this.isErr = true;
          this.errMsgSELL = 'You must set ' + this.BaseToken + ' Token allowance';
          this.cleanOrdertiker('SELL');
          return;
        }
        const takerTokenAllowanceStatus = this.quoteTokenStatus.TokenAllowance;
        // console.log(takerTokenAllowanceStatus);
        if (!takerTokenAllowanceStatus) {
          this.isErr = true;
          this.errMsgSELL = 'You must set ' + this.quoteToken + ' Token allowance';
          this.cleanOrdertiker('SELL');
          return;
        }
        const temp_amount1 = new BigNumber(
          (
            Number(this.PriceSELL.value) * Number(this.AmountSELL.value)
          ).toFixed(15)
        );
        const amount1 = ZeroEx.toBaseUnitAmount(temp_amount1, constant.DECIMAL_PLACES_ETH);
        if (Number(amount1) < 0) {
          this.isErr = true;
          this.errMsgSELL = 'Amount cannot be empty';
          this.cleanOrdertiker('SELL');
          return;
        }
        const amount2 = ZeroEx.toBaseUnitAmount(new BigNumber(this.AmountSELL.value), constant.DECIMAL_PLACES_ETH);
        if (Number(amount2) < 0) {
          this.isErr = true;
          this.errMsgSELL = 'Amount cannot be empty';
          this.cleanOrdertiker('SELL');
          return;
        }
        const expireUnixtime = new BigNumber(this.ExpireDateSELL.value.getTime() / 1000);
        if (!expireUnixtime) {
          this.isErr = true;
          this.errMsgSELL = 'Expiration date cannot be empty';
          this.cleanOrdertiker('SELL');
          return;
        }

        takerTokenAddress = await this.zeroExService.getTokenAddress(this.BaseToken);
        makerTokenAddress = constant.QUOTE_TOKEN;
        makerTokenAmount = amount2;
        takerTokenAmount = amount1;
        const AvailabletakerTokenAmount = await this.zeroExService.getEvotTokenBalance(this.coinbase);
        if ( Number(AvailabletakerTokenAmount) < Number(takerTokenAmount)) {
          this.isErr = true;
          this.errMsgSELL = 'Insufficient ' + this.quoteToken + ' Balance';
          this.cleanOrdertiker('SELL');
          return;
        }
        if (EXCHANGE_ADDRESS) {
          if (action === 'filled') {
            const orderSalt = this.ordersaltSELL.value;
            try {
              //check if already enough filled order
              const last24h = Math.floor(new Date().getTime() / 1000) - 86400;
              let available_sell = 0;
              for(let i = 0; i < this.myHistoryOrders.length; i++) {
                if(this.myHistoryOrders[i]['closeAt'] > last24h) {
                  if(this.myHistoryOrders[i]['type'] === 'buy') {
                    if(this.myHistoryOrders[i]['state'] === 'filled') {
                      available_sell += +this.myHistoryOrders[i]['remainedTakerTokenAmount'];
                    }
                  }
                }
              }
              
              //get max trade limit
              const max_limit = await this.marketService.getExchangeMaxLimit();
              const max_val = max_limit[0]['max_limit'];
              if (this.AmountSELL.value > max_val - available_sell / 10 ** 18) {
                this.isErr = true;
                this.errMsgSELL = 'You can fill ' + (max_val - available_sell / 10 ** 18).toFixed(2) + ' EVOTs max per daily.';
                this.cleanOrdertiker('SELL');
                return;
              }
              
              const order = await this.marketService.getOrderBySalt(orderSalt.toString());
              const ecSignature = {
                r: (order.ecSignature.r).toString(),
                s: (order.ecSignature.s).toString(),
                v: Number(order.ecSignature.v)
              };
              const orderhash = ZeroEx.getOrderHashHex(order);
              const orderToFill: SignedOrder = {
                ecSignature: ecSignature,
                exchangeContractAddress: order.exchangeContractAddress,
                expirationUnixTimestampSec: new BigNumber(order.expirationUnixTimestampSec),
                feeRecipient: order.feeRecipient,
                maker: order.maker,
                makerFee: new BigNumber(order.makerFee),
                makerTokenAddress: order.makerTokenAddress,
                makerTokenAmount: new BigNumber(order.makerTokenAmount),
                salt: order.salt,
                taker: order.taker,
                takerFee: new BigNumber(order.takerFee),
                takerTokenAddress: order.takerTokenAddress,
                takerTokenAmount: new BigNumber(order.takerTokenAmount),
              };
              if (ZeroEx.isValidSignature(orderhash, orderToFill.ecSignature, orderToFill.maker)) {
                console.log('is valid order');
              } else {
                console.log('is invalid order');
              }

              const fillTakerAmount = new BigNumber(+this.AmountSELL.value * 10**18);
              const makerAmount= document.getElementById('sell_totalweth').innerText;
              const a = +makerAmount.toString();
              const b = a.toString().split('.');
              const c = b[1];
              let d;
              let e;
              if(c) {
                d = c.length;
                e = +c;
              }              
              let fillMakerAmount;
              if (b[0] === '0') 
                fillMakerAmount = new BigNumber(this.multdec(e, 10**(18 - d)));
              else 
                fillMakerAmount = new BigNumber(this.multdec( +makerAmount, 10**18));
                
              let order_status = 0;
              if(+order.remainedTakerTokenAmount <= +fillTakerAmount.toString()) {
                console.log('full filled');
                order_status = 1;
              } else {
                console.log('partially filled');
                order_status = 0;
              }      
              
              const fillTxHash = await this.zeroExService.fillOrderAsync(orderToFill, fillTakerAmount, this.coinbase);
              const log = await this.zeroExService.awaitTransactionMinedAsync(fillTxHash);
              if (log.status === 1) {
                const result = await this.marketService.filledOrder(order.salt, fillTxHash, fillMakerAmount.toString(), fillTakerAmount.toString(), order_status, this.coinbase);
                if (order_status == 1) {
                  if (result.state === 'ok') {
                    this.openSnackBar('An order was filled successfully. For Etherscan verification, click', 'here', fillTxHash);
                    this.getMyOrders();
                    this.getMarketHistory();
                    this.cleanOrdertiker('BUY');
                    return;
                  } else {
                    this.isErr = true;
                    this.errMsgBUY = 'Could not fill the order. Network error';
                    this.cleanOrdertiker('BUY');
                  }
                } else {
                  if (result.state === 'ok') {
                    const insert_result = await this.marketService.filledPartialOrder(order.salt, fillTxHash, fillMakerAmount.toString(), fillTakerAmount.toString(), order.maker, this.coinbase, order.makerTokenAddress, order.takerTokenAddress);
                    if (insert_result.state === 'ok') {
                      this.openSnackBar('An order was filled successfully. For Etherscan verification, click', 'here', fillTxHash);
                      this.getMyOrders();
                      this.getMarketHistory();
                      this.cleanOrdertiker('BUY');
                      return;
                    } else {
                      this.isErr = true;
                      this.errMsgBUY = 'Could not fill the order. Network error';
                      this.cleanOrdertiker('BUY');
                    }
                  } else {
                    this.isErr = true;
                    this.errMsgBUY = 'Could not fill the order. Network error';
                    this.cleanOrdertiker('BUY');
                  }
                }
                
              } else {
                this.isErr = true;
                this.errMsgBUY = 'Unfortunately, Could not fill the order';
                this.cleanOrdertiker('BUY');
              }
            } catch (e) {
              console.log(e);
              this.cleanOrdertiker('SELL');
            }
          } else {
            try {

              // check if already full created the sell order
              let available_sell = 0;
              for(let i = 0; i < this.myActiveOrders.length; i++) {
                if(this.myActiveOrders[i]['type'] === 'sell') {
                  available_sell += +this.myActiveOrders[i]['remainedMakerTokenAmount'];
                }
              }
              //get max trade limit
              const max_limit = await this.marketService.getExchangeMaxLimit();
              const max_val = max_limit[0]['max_limit'];
              if (this.AmountSELL.value > max_val - available_sell / 10 ** 18) {
                this.isErr = true;
                this.errMsgSELL = 'Today you can add ' + (max_val - available_sell / 10 ** 18).toFixed(2) + ' EVOTs more.';
                this.cleanOrdertiker('SELL');
                return;
              }

              const feesRequest: FeesRequest = {
                exchangeContractAddress: EXCHANGE_ADDRESS,
                maker: this.coinbase,
                taker: ZeroEx.NULL_ADDRESS,
                makerTokenAddress: makerTokenAddress,
                takerTokenAddress: takerTokenAddress,
                makerTokenAmount,
                takerTokenAmount,
                expirationUnixTimestampSec: expireUnixtime,
                salt: ZeroEx.generatePseudoRandomSalt(),
              };
              feesResponse = await this.orderService.getFeesAsync(feesRequest);
              const order: any = {
                ...feesRequest,
                ...feesResponse
              };
              const orderHash = ZeroEx.getOrderHashHex(order);
              const ecSignature = await this.zeroExService.getECSignature(orderHash, this.coinbase);
              if (ecSignature) {
                const signedOrder: any = {
                  ...order,
                  ecSignature
                };
                const validate = this.zeroExService.validateOrderFillableOrThrow(signedOrder);
                if (validate) {
                  await this.orderService.SubmitOrder(signedOrder);
                  this.openSnackBar('A New Order created', '', '');
                  this.getMyOrders();
                  this.cleanOrdertiker('SELL');
                } else {
                  this.isErr = true;
                  this.errMsgSELL = 'Cannot create your order';
                  this.cleanOrdertiker('SELL');
                  return;
                }
              } else {
                this.isErr = true;
                this.errMsgSELL = 'Cannot create your order';
                this.cleanOrdertiker('SELL');
                return;
              }
            } catch (e) {
              this.isErr = true;
                this.errMsgSELL = 'API SERVER ERROR';
                this.cleanOrdertiker('SELL');
                return;
            }
          }
        }
      }



  }
  cleanOrdertiker(_type: string) {
    if (_type === 'BUY') {
      this.AmountBUY.setValue(0);
      this.PriceBUY.setValue('');
      this.actionBUY.setValue('');
      this.ExpireDateBUY.setValue(' ');
      this.ordersaltBUY.setValue('');
      // this.AmountBUY.enable();
      // this.PriceBUY.enable();
      // this.ExpireDateBUY.enable();
    } else {
      this.AmountSELL.setValue(0);
      this.PriceSELL.setValue('');
      this.actionSELL.setValue('');
      this.ExpireDateSELL.setValue(' ');
      this.ordersaltSELL.setValue('');
      // this.AmountSELL.enable();
      // this.PriceSELL.enable();
      // this.ExpireDateSELL.enable();
    }
    this.isCreatingBuyOrder = false;
    this.isCreatingSellOrder = false;
    this.getMyOrders();
  }
   // Snackbar
   public openSnackBar(message: string, action: string, data: string) {
    
    this.dialog.open(DialogWhenSnackBarViewed, {
      data: { message: message, action: action, url: this.etherscan_url + data, }
    });

    const snackBarRef = this.snackBar.open(message, action, {
      data: data,
      duration: 7000,
    });
    snackBarRef.afterDismissed().subscribe(() => {
      console.log('The snack-bar was dismissed');
    });

    snackBarRef.onAction().subscribe(() => {
      window.open(
        this.etherscan_url + data,
        '_blank' // <- This is what makes it open in a new window.
      );
    });
  }
  openAccountAlertDialog(_errType: string) {
    let dialogRef;
    if (_errType === 'err_web3') {
      dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
        height: '400px',
        width: '450px'
      });
    } else if (_errType === 'err_network') {
      dialogRef = this.dialog.open(Web3ConfirmDialogComponent, {
        height: '400px',
        width: '450px'
      });
    }

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
  // Cancel My Order
  public async closeOrder(order: any) {
    // alert(order.orderHash);
    const tx = await this.marketService.cancelOrder(order);
    this.snackBar.openFromComponent(MessageArchivedComponent, {
      data: 'Info: Order Cancelled!',
      duration: 1000,
    });
    this.getMyOrders();
    // window.location.reload();
  }

  public convertTo(_type: string) {
    this.isConverting = true;
    let available;
    if (_type === 'ETH') {
      available = this.etherBalance;
    } else if (_type === 'WETH') {
      available = this.BaseTokenStatus.TokenBalance;
    }
    const dialogRef = this.dialog.open(ConvertEthComponent, {
      height: '300px',
      width: '400px',
      data: { token: _type, available: available, amount: '' }
    });

    dialogRef.afterClosed().subscribe( async result => {
      console.log('The dialog was closed');
      // this.dialogRef = null;
      if (result) {
        if ( _type === 'ETH') {
          this.isConverting = true;
          const chng_amount = result;
          if (!chng_amount || chng_amount < 0) {
              this.isConverting = false;
              const msg = 'Wrong input value. Please input the valid amount';
              this.openSnackBar(msg, '', '');
              return;
          } else if (chng_amount > this.etherBalance) {
            this.isConverting = false;
            const msg = 'Inficient Balance. Please input valid amount';
            this.openSnackBar(msg, '', '');
            return;
          }
          const amount = ZeroEx.toBaseUnitAmount(new BigNumber(chng_amount), constant.DECIMAL_PLACES_ETH);
          try {
            const tx = await this.zeroExService.wrapETH(amount, this.coinbase);
            const rlt = await this.zeroExService.awaitTransactionMinedAsync(tx);
            if (rlt.status === 1) {
              this.isConverting = false;
              this.getEtherBalance();
              this.getUserInfo();
              const msg = 'Token wrapped successfully. please click link to confirm';
              const action = 'here';
              this.openSnackBar(msg, action, tx);
              return;
            }
          } catch (e) {
            this.isConverting = false;
            const msg = 'Unknown Error occured! please try again';
            this.openSnackBar(msg, '', '');
            return;
          }
        } else if ( _type === 'WETH') {
          this.isConverting = true;
          const chng_amount = result;
          if (!chng_amount || chng_amount < 0) {
            this.isConverting = false;
            const msg = 'Wrong input value. Please input the valid amount';
            this.openSnackBar(msg, '', '');
            return;
          } else if (chng_amount > this.BaseTokenStatus.TokenBalance) {
            this.isConverting = false;
            const msg = 'Inficient Balance. Please input valid amount';
            this.openSnackBar(msg, '', '');
            return;
          }
          const amount = ZeroEx.toBaseUnitAmount(new BigNumber(chng_amount), constant.DECIMAL_PLACES_ETH);
          try {
            const tx = await this.zeroExService.unwrapETH(amount, this.coinbase);
            const rlt = await this.zeroExService.awaitTransactionMinedAsync(tx);
            if (rlt.status === 1) {
              this.isConverting = false;
              this.getEtherBalance();
              this.getUserInfo();
              const msg = 'Token wrapped successfully. please click link to confirm';
              const action = 'here';
              this.openSnackBar(msg, action, tx);
              return;
            }
          } catch (e) {
            this.isConverting = false;
            this.isConverting = false;
            const msg = 'Unknown Error occured! please try again';
            this.openSnackBar(msg, '', '');
            return;
          }
        }
      }
      this.isConverting = false;
    });
  }

    // Confirm trading history
  confirm(txhash: string) {
    window.open(this.etherscan_url + txhash, '_blank');
  }
  // Boolean Order type
  ordertype(type: string) {
    // alert(type);
    if (type === 'buy') {
      return true;
    } else {
      return false;
    }
  }
  statetype(state: string) {
    if ( state === 'filled') {
      return true;
    } else {
      return false;
    }
  }
  public async _onChangeMarketBUY(_Obj: any, _type: string) {
    if (_type === 'BUY') {
      this.selected_buy = _Obj.value;
    } else {
      this.selected_sell = _Obj.value;
    }
  }
  public async register_new_token() {
    // Init Err function
    this.isErrRegisterNewToken = false;
    // Start register processing...
    this.isRegisteringToken = true;

    // Get Input values for new Token
    const new_tknEmail = this.token_email.value;
    const new_tknVerifyLink = this.token_verify_url.value;
    const new_tknAnnounceLink = this.token_announce_url.value;
    const new_tknWebsite = this.new_token_website.value;
    const new_tknName = this.new_token_name.value;
    const new_tknSymbol = this.new_token_symbol.value;
    const new_tknAddress = this.new_token_address.value;
    const new_tknDecimal = this.new_token_decimal.value;
    
    // Check input values is valid
    if (!new_tknEmail || new_tknEmail === '') {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      this.errMsg = 'The Email address must be given';
      return false;
    }

    if (!new_tknName || new_tknName === '') {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      this.errMsg = constant.ErrMsg.isEmptyTokenName;
      return false;
    }
    if (!new_tknSymbol || new_tknSymbol === '') {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      this.errMsg = constant.ErrMsg.isEmptyTokenSymbol;
      return false;
    }
    if (!new_tknAddress || new_tknAddress === '') {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      this.errMsg = constant.ErrMsg.isEmptyTokenAddress;
      return false;
    }
    if (!new_tknDecimal || new_tknDecimal < 0) {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      this.errMsg = constant.ErrMsg.isEmptyTokenDecimal;
      return false;
    }
    if (!new_tknWebsite || new_tknWebsite < 0) {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      this.errMsg = 'Website of the Token must be given';
      return false;
    }
    if (!new_tknVerifyLink || new_tknVerifyLink < 0) {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      this.errMsg = 'Link to verify Token address must be given';
      return false;
    }
    if (!new_tknAnnounceLink || new_tknAnnounceLink < 0) {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      this.errMsg = 'Token Announcment forum link must be given';
      return false;
    }
    // All valid datas goes here
    try {
      const result = await this.marketService.registerNewToken(
        new_tknName,
        new_tknSymbol,
        new_tknAddress,
        new_tknDecimal,
        new_tknEmail,
        new_tknWebsite,
        new_tknVerifyLink,
        new_tknAnnounceLink,
      );
      console.log(result);
      if (result.status && result.status === 'ok') {
        this.isRegisteringToken = false;
        this.openSnackBar(result.result, 'success', '');
        await this.getTokenlists();
        this._init_form();
        return false;
      } else {
        this.isRegisteringToken = false;
        this.isErrRegisterNewToken = true;
        this.errMsg = result.result;
        this._init_form();
        return false;
      }
    } catch (e) {
      this.isRegisteringToken = false;
      this.isErrRegisterNewToken = true;
      console.log(e);
      this.errMsg = 'Failed to validate Token';
      this._init_form();
      return false;
    }
  }

  private _init_form() {
    this.new_token_name.setValue('');
    this.new_token_symbol.setValue('');
    this.new_token_address.setValue('');
    this.new_token_decimal.setValue('18');
   }
  // Draw stock chart with chartData
  public async drawChart1() {
    am4core.useTheme(am4themes_myTheme);
    
    let chDataProvider = await this.getChartData();
    // const avr_price = chDataProvider[0]['price'] / chDataProvider[0]['quantity'];
    // const datetime = new Date(chDataProvider[0]['created_on'] * 1000);
    
    this.zone.runOutsideAngular(() => {
      let chart = am4core.create("chart_container", am4charts.XYChart);

      chart.paddingRight = 20;

      let data = [];
      let avr_price: any;
      
      for (let i = 0; i < chDataProvider.length; i++) {
        let newDate = new Date();
        newDate.setDate(new Date(chDataProvider[i]['c']).getDate());
        avr_price = (chDataProvider[i]['price'] / chDataProvider[i]['counts']).toFixed(7);
        data.push({ date: newDate, value: avr_price });
      }
      chart.data = data;

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.tooltip.disabled = true;
      valueAxis.renderer.minWidth = 35;

      let series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.dateX = "date";
      series.dataFields.valueY = "value";

      series.tooltipText = "1 EVOT = {valueY.value} ETH";
      
      chart.cursor = new am4charts.XYCursor();

      let scrollbarX = new am4charts.XYChartScrollbar();
      scrollbarX.series.push(series);
      chart.scrollbarX = scrollbarX;

      this.chart = chart;
    });
    
    function am4themes_myTheme(target) {
      if (target instanceof am4core.InterfaceColorSet) {
        target.setFor("stroke", am4core.color("#800080"));
        target.setFor("secondaryButton", am4core.color("#201625"));
        target.setFor("secondaryButtonHover", am4core.color("#201625").lighten(-0.2));
        target.setFor("secondaryButtonDown", am4core.color("#201625").lighten(-0.2));
        target.setFor("secondaryButtonActive", am4core.color("#201625").lighten(-0.2));
        target.setFor("secondaryButtonText", am4core.color("#FFFFFF"));
        target.setFor("secondaryButtonStroke", am4core.color("#201625"));
        target.setFor("text", am4core.color("#FFFFFF"));
        target.setFor("fill", am4core.color("#201625"));
        target.setFor("background", am4core.color("#201625"));
        target.setFor("alternativeText", am4core.color("#FFFFFF"));        
      }
    }
  }

  public async drawChart() {
    am4core.useTheme(am4themes_myTheme);
    
    // Add data
    this.zone.runOutsideAngular(() => {
      let chart = am4core.create("chart_container", am4charts.XYChart);

      chart.paddingRight = 20;

      let data = [];
      let visits = 10;
      for (let i = 1; i < 366; i++) {
        visits += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 10);
        data.push({ date: new Date(2018, 0, i), name: "name" + i, value: visits });
      }

      chart.data = data;

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.tooltip.disabled = true;
      valueAxis.renderer.minWidth = 35;

      let series = chart.series.push(new am4charts.LineSeries());
      series.dataFields.dateX = "date";
      series.dataFields.valueY = "value";

      series.tooltipText = "1 EVOT = {valueY.value} ETH";
      chart.cursor = new am4charts.XYCursor();

      let scrollbarX = new am4charts.XYChartScrollbar();
      scrollbarX.series.push(series);
      chart.scrollbarX = scrollbarX;

      this.chart = chart;
    });

    function am4themes_myTheme(target) {
      if (target instanceof am4core.InterfaceColorSet) {
        target.setFor("stroke", am4core.color("#800080"));
        target.setFor("secondaryButton", am4core.color("#201625"));
        target.setFor("secondaryButtonHover", am4core.color("#201625").lighten(-0.2));
        target.setFor("secondaryButtonDown", am4core.color("#201625").lighten(-0.2));
        target.setFor("secondaryButtonActive", am4core.color("#201625").lighten(-0.2));
        target.setFor("secondaryButtonText", am4core.color("#FFFFFF"));
        target.setFor("secondaryButtonStroke", am4core.color("#201625"));
        target.setFor("text", am4core.color("#FFFFFF"));
        target.setFor("fill", am4core.color("#201625"));
        target.setFor("background", am4core.color("#201625"));
        target.setFor("alternativeText", am4core.color("#FFFFFF"));        
      }
    }
  }
  // get ticker data
  public async getTickerData() {
    let ticker_market24hLow;
    let ticker_market24hHigh;
    try {
      setInterval(async () => {
        const ticker = await this.marketService.getTickerDataFromServer();
        this.ticker_market24hVolume = ticker[0]['last_24h_volume'];
        ticker_market24hHigh = ticker[0]['high_price'];
        ticker_market24hLow = ticker[0]['low_price'];
        this.ticker_lastPrice = ticker[0]['last_price'];
        this.ticker_lastBid = ticker[0]['last_bid'];
        this.ticker_lastAsk = ticker[0]['last_ask'];
        
        // Check If value is up or down       
        if (ticker_market24hHigh > this.market24hHigh) {
          this.is24hHighUp = 'up';
        } else if (ticker_market24hHigh < this.market24hHigh) {
          this.is24hHighUp = 'down';
        } else {
          this.is24hHighUp = 'default';
        }

        if (ticker_market24hLow < this.market24hLow) {
          this.is24hLowUp = 'up';
        } else if (ticker_market24hLow > this.market24hLow) {
          this.is24hLowUp = 'down';
        } else {
          this.is24hLowUp = 'default';
        }

        if (ticker_market24hHigh) {
          this.market24hHigh = ticker_market24hHigh;
        } 
        if (ticker_market24hLow) {
          this.market24hLow = ticker_market24hLow;
        }
      }, 5000);
    } catch (e) {
      console.log(e);
    }
  }
}
