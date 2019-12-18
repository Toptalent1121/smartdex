import { Component, OnInit,  Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {MatSnackBar} from '@angular/material';
import {MAT_SNACK_BAR_DATA} from '@angular/material';
import { FormControl, Validators } from '@angular/forms';
import { FormGroup, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-dialog-web3-confirm',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class Web3ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }
}

@Component({
  selector: 'app-dialog-account-confirm',
  templateUrl: './accountConfirm.dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class AccountConfirmDialogComponent {}

@Component({
  selector: 'app-snack-bar',
  templateUrl: './snakbar.component.html',
})
export class MessageArchivedComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) { }

}

@Component({
  selector: 'app-dialog-overview-dialog',
  templateUrl: 'dialog.SendToken.html',
})
export class TokenSendComponent {

  address = new FormControl('', [Validators.required]);
  amount = new FormControl('', [Validators.required]);
  form: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
@Component({
  selector: 'app-convert-eth-dialog',
  templateUrl: 'dialog.ConvertEth.html',
})
export class ConvertEthComponent {


  available = new FormControl('', [Validators.required]);
  amountTo = new FormControl('', [Validators.required]);
  form: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'dialog-data-when-snackbar-viewed',
  templateUrl: './dialog.snackbar.html',
})
export class DialogWhenSnackBarViewed {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<any>) {}
  onNoClick(): void {
    this.dialogRef.close();
  }
}
