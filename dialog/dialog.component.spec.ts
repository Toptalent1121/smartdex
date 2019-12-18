import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Web3ConfirmDialogComponent, AccountConfirmDialogComponent, MessageArchivedComponent, TokenSendComponent } from './dialog.component';

describe('Web3ConfirmDialogComponent', () => {
  let component: Web3ConfirmDialogComponent;
  let fixture: ComponentFixture<Web3ConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Web3ConfirmDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Web3ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
describe('AccountConfirmDialogComponent', () => {
  let component: AccountConfirmDialogComponent;
  let fixture: ComponentFixture<AccountConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountConfirmDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
describe('MessageArchivedComponent', () => {
  let component: MessageArchivedComponent;
  let fixture: ComponentFixture<MessageArchivedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MessageArchivedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageArchivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
describe('TokenSendComponent', () => {
  let component: TokenSendComponent;
  let fixture: ComponentFixture<TokenSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TokenSendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
