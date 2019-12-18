import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, map, tap } from 'rxjs/operators';
import { constant } from '../config/constant';
import { Token } from '../config/token';
import { ZeroExService } from '../lib/zeroExService';
import { WebService } from '../lib/Web3Service';
import { MatDialog, MAT_DIALOG_DATA} from '@angular/material';
import { Web3ConfirmDialogComponent, AccountConfirmDialogComponent } from '../dialog/dialog.component';
const Web3 = require('web3');
declare var web3;
@Injectable()
export class AccountsService {

  constructor(private http: HttpClient, private zeroExService: ZeroExService, public dialog: MatDialog ) { }

  getTokenList() {
    const url = constant.API_URL + '/tokens';
    return this.http.get(url)
            .toPromise()
            .then(response => response as any[])
            .catch(err => {
              // console.log(err);
              return err;
            });
  }
}
