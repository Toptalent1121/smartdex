import { Injectable } from '@angular/core';

declare var web3;
@Injectable()
  export class WebService {
    public checkMetamaskInstalled(): boolean {
      return typeof web3 !== 'undefined' && web3.currentProvider.isMetaMask === true;
    }

    public checkMetamaskLoggedIn(): boolean {
      return this.checkMetamaskInstalled() && web3.eth.accounts !== undefined && web3.eth.accounts.length > 0;
    }

    public checkMetamaskNetwork(): boolean {
      return this.checkMetamaskInstalled() && this.checkMetamaskLoggedIn() && web3.version.network === '42';
    }
}
