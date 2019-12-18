import { Component, OnInit, OnDestroy } from '@angular/core';
import { Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Token, TokenStatus} from '../config/token';
import { constant } from '../config/constant';
import { FormControl, Validators } from '@angular/forms';
import { NgSwitch } from '@angular/common';
import { Ng4LoadingSpinnerModule, Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';
import { MatSnackBar } from '@angular/material';
import { MAT_SNACK_BAR_DATA } from '@angular/material';
import { Web3ConfirmDialogComponent, AccountConfirmDialogComponent, TokenSendComponent, MessageArchivedComponent } from '../dialog/dialog.component';
import { ZeroExService } from '../lib/zeroExService';
import { OrderService } from '../lib/OrderService';
import { MarketService } from '../market/market.service';
import { AccountsService } from './accounts.service';
import { SlicePipe } from '@angular/common';
import { BigNumber } from 'bignumber.js';
import { ZeroEx } from '0x.js';
import * as _ from 'lodash';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})

export class AccountComponent implements OnInit, OnDestroy {
  color = 'accent';
  checked = false;
  disabled = false;
  isErrEth = false;
  isErrWeth = false;
  isErrRegisterNewToken = false;
  globalErr = false;
  etherscan = constant.AUDIT_TRANSACTION_URL;
  isTokenTransfor = false;
  isEmptyEthBalance = true;
  isEmptywethBalance = true;
  isWrappingEth = false;
  isRegisteringToken = false;
  isUnWrappingEth = false;
  addressToSend: string;
  amountToSend: number;
  balances: Array<any>;
  allowance: Array<any>;
  isProcessing = false;
  BaseTokenInfo: any;
  myHistoryOrders: Array<any>;
  userEthBalance: Number;
  userWethBalance: Number;
  txlists: Array<any>;
  errMsg = '';
  Tokenlists: Array<any>;
  tokens_by_symbol: Array<any>;
  BaseToken = constant.BASE_TOKEN;
  mobileQuery: MediaQueryList;
  userAddress: string;
  eth_amount = new FormControl('', [Validators.required]);
  weth_amount = new FormControl('', [Validators.required]);
  new_token_name = new FormControl('', [Validators.required]);
  new_token_symbol = new FormControl('', [Validators.required]);
  new_token_address = new FormControl('', [Validators.required]);
  new_token_decimal = new FormControl('', [Validators.required]);
  private _mobileQueryListener: () => void;

  constructor(
    private route: ActivatedRoute,
    private zeroExService: ZeroExService,
    private orderService: OrderService,
    private marketService: MarketService,
    private ng4LoadingSpinnerService: Ng4LoadingSpinnerService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    changeDetectorRef: ChangeDetectorRef,
    media: MediaMatcher,
    meta: Meta,
    title: Title
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    // Sets the <title></title>
    title.setTitle('Decentralized Exchange platform - ERC20 Token compatible wallet');

    // Sets the <meta> tag for the page
    meta.addTags([
      { name: 'author', content: 'Crypto' },
      { name: 'description', content: 'This is the ERC20 Token compatible wallet of 0x protocol based Decentralized Exchange platform.' },
    ]);
  }

  async ngOnInit() {
      // this.startLoadingSpinner();
      this.marketService.checkWeb3Support();
      this.userAddress = await this.getCoinbase();
      this.getTokenlists();
      this.getEthBalance();
      this.getWethBalance();
      this.GetTokenBalance();
      this.getTradeHistoryAll();
  }
  ngOnDestroy() {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
  public async getCoinbase() {
    return await this.zeroExService.getCoinBase();
  }
  // Get Tokenlist supported By relayer
  public async getTokenlists() {
    this.Tokenlists = await this.marketService.getAllTokenList();
  }
  // Page Loading....
  // public startLoadingSpinner() {
  //   this.ng4LoadingSpinnerService.show();

  //   setTimeout(function() {
  //     this.ng4LoadingSpinnerService.hide();
  //   }.bind(this), 2000);
  // }

  // Get user ether balance
  public async getEthBalance() {
    this.isEmptyEthBalance = true;
    if (!this.userAddress) {
      const msg = 'Cannot find User Address!';
      const action = 'here';
      this.openSnackBar(msg, '', '');
    }
    let ethBalance: BigNumber;
    ethBalance = await this.zeroExService.getEthBalance(this.userAddress);
    this.userEthBalance = ZeroEx.toUnitAmount(new BigNumber(ethBalance), constant.DECIMAL_PLACES_ETH).toNumber();
    this.isEmptyEthBalance = false;
    // console.log(this.userEthBalance);
  }
  private _init_errMsg() {
    this.isErrWeth = false;
    this.isErrEth = false;
    this.isErrRegisterNewToken = false;
  }
  // Get user weth balance
  public async getWethBalance() {
    this.isEmptywethBalance = true;
    if (!this.userAddress) {
      const msg = 'Please make sure that your browser supports web3 provider';
      const action = 'here';
      this.openSnackBar(msg, '', '');
      return;
    }
    let wethBalance: BigNumber;
    wethBalance = await this.zeroExService.getTokenBalance(this.BaseToken, this.userAddress);
    this.userWethBalance = ZeroEx.toUnitAmount(new BigNumber(wethBalance), constant.DECIMAL_PLACES_ETH).toNumber();
    this.isEmptywethBalance = false;
  }

  // Wrap/ Unwrap Ether
  public async convert(type: string) {
    this._init_errMsg();
    if ( type === 'eth') {
      this.isWrappingEth = true;
      const chng_amount = this.eth_amount.value;
      if (!chng_amount || chng_amount < 0) {
        this.isWrappingEth = false;
        this.isErrEth = true;
        this.errMsg = constant.ErrMsg.isEmptyConvertValue;
        return;
      } else if (chng_amount > this.userEthBalance) {
        this.isWrappingEth = false;
        this.isErrEth = true;
        this.errMsg = constant.ErrMsg.ExceedConvertValue;
        return;
      }
      const amount = ZeroEx.toBaseUnitAmount(new BigNumber(chng_amount), constant.DECIMAL_PLACES_ETH);
     try {
        const tx = await this.zeroExService.wrapETH(amount, this.userAddress);
        const result = await this.zeroExService.awaitTransactionMinedAsync(tx);
        if (result.status === 1) {
          this.eth_amount.setValue(0);
          this.isWrappingEth = false;
          this.getEthBalance();
          this.getWethBalance();
          const msg = 'Token wrapped successfully. please click link to confirm';
          const action = 'here';
          this.openSnackBar(msg, action, tx);
          return;
        }
     } catch (e) {
        this.isWrappingEth = false;
        this.eth_amount.setValue(0);
        this.isErrEth = true;
        this.errMsg = constant.ErrMsg.FailToWrapEther;
        return;
     }
    } else if ( type === 'weth') {
      this.isUnWrappingEth = true;
      const chng_amount = this.weth_amount.value;
      if (!chng_amount || chng_amount < 0) {
        this.isUnWrappingEth = false;
        this.isErrWeth = true;
        this.errMsg = constant.ErrMsg.isEmptyConvertValue;
        return;
      } else if (chng_amount > this.userWethBalance) {
        this.isUnWrappingEth = false;
        this.isErrWeth = true;
        this.errMsg = constant.ErrMsg.ExceedConvertValue;
        return;
      }
      const amount = ZeroEx.toBaseUnitAmount(new BigNumber(chng_amount), constant.DECIMAL_PLACES_ETH);
      try {
        const tx = await this.zeroExService.unwrapETH(amount, this.userAddress);
        const result = await this.zeroExService.awaitTransactionMinedAsync(tx);
        if (result.status === 1) {
          this.weth_amount.setValue(0);
          this.isUnWrappingEth = false;
          this.getEthBalance();
          this.getWethBalance();
          const msg = 'Token unwrapped successfully. please click link to confirm';
          const action = 'here';
          this.openSnackBar(msg, action, tx);
          return;
        }
     } catch (e) {
        this.isUnWrappingEth = false;
        this.weth_amount.setValue(0);
        this.isErrWeth = true;
        this.errMsg = constant.ErrMsg.FailToUnWrapEther;
        return;
     }
    }
  }

  // Get All Tokens Balance and Allowance
 public async GetTokenBalance() {
  const tokenInfo = [];
  this.BaseTokenInfo = await this.zeroExService.getBalanceAndAllowance(this.BaseToken, this.userAddress);
   const tokens = await this.marketService.getAllTokenList();
   if (tokens) {
     console.log(tokens.length);
     for ( let i = 0; i < tokens.length; i++) {
        tokenInfo[i] = await this.zeroExService.getBalanceAndAllowance(tokens[i].symbol, this.userAddress);
      //  this.balances[tokens[i].symbol] = tokenInfo.TokenBalance;
      //  this.allowance[tokens[i].symbol] = tokenInfo.TokenBalance;
     }
    }
    this.tokens_by_symbol = tokenInfo;
  }

  // Change Allowance
  public async onAllowanceChange(event): Promise<any> {
    this.isProcessing = true;
    event.target.checked = !event.target.checked;
    let tokenAddr;
    let token;
    let tx;
    let isAllowance;
    token = event.target.id;
    try {
      tokenAddr = await this.zeroExService.getTokenAddress(token);
      isAllowance = event.target.checked;
      tx = await this.zeroExService.setProxyAllowanceAsync(tokenAddr, isAllowance);
      event.target.checked = !event.target.checked;
    } catch (e) {
      console.log(e);
    }
    this.isProcessing = false;
  }
  // synchronous with user input event
  getErrorMessage(type: string) {
    if (type === 'eth_amount') {
      return this.eth_amount.hasError('required') ? 'Input an amount value' : '';
    } else if (type === 'weth_amount') {
      return this.weth_amount.hasError('required') ? 'Input an amount value' : '';
    }
  }
  openDialog(type: string): void {
    this.isProcessing = true;
    const dialogRef = this.dialog.open(TokenSendComponent, {
      height: '300px',
      width: '400px',
      data: { token: type, address: '', amount: '' }
    });

    dialogRef.afterClosed().subscribe( async result => {
      console.log('The dialog was closed');
      // this.dialogRef = null;
      if (result) {
        try {
          const params = result.toString().split(',');
          this.addressToSend = params[0].trim();
          this.amountToSend = params[1];
          const tx = await this.sendToken(type, this.addressToSend, new BigNumber(params[1]));
          const isSuccess = await this.zeroExService.awaitTransactionMinedAsync(tx);
          if (isSuccess.status === 1) {
            this.GetTokenBalance();
            const msg = 'Token transfered successfully. please click link to confirm';
            const action = 'here';
            this.openSnackBar(msg, action, tx);
          }
        } catch (e) {
          console.log(e);
        }
      }
      this.isProcessing = false;
    });
  }
  public async sendToken(token: string, addressTo: string, amount: BigNumber) {
      return this.zeroExService.TransferTokenAsync(token, this.userAddress, addressTo, amount);
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
        this.etherscan + data,
        '_blank' // <- This is what makes it open in a new window.
      );
    });
  }
  public async getTradeHistoryAll() {
    let myTradeHistory: any;
    const myAddress = await this.zeroExService.getCoinBase();
    const BASE_TOKEN_ADDRESS = await this.zeroExService.getTokenAddress(this.BaseToken);
    if (myAddress) {
       const baseTokenAddress = BASE_TOKEN_ADDRESS;
       console.log(baseTokenAddress);
       myTradeHistory = await this.marketService.getTradeHistoryAll(myAddress);
       this.myHistoryOrders = myTradeHistory;
      //  console.log(activeOrders);
    }
  }
  // Get Transaction history
  public async getTransactionHistory() {
    const transactions = await this.marketService.getTransactionHistory(this.userAddress);

    this.txlists = transactions.result;
  }

  private _init_form() {
   this.new_token_name.setValue('');
   this.new_token_symbol.setValue('');
   this.new_token_address.setValue('');
   this.new_token_decimal.setValue('18');
  }
  // // Function to check if an image exists in the url
  // imageExists(url, callback) {
  //   const img = new Image();
  //   img.onload = function() { callback(true); };
  //   img.onerror = function() { callback(false); };
  //   img.src = url;
  // }

  // // Check If token_icon exists
  // async IfTokenIconExist(token) {
  //   const url = 'http://localhost:4200/assets/img/token_icons/' + token + '.png';
  //   await this.imageExists(url, function(exists) {
  //     return exists;
  //   });
  // }
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
}
