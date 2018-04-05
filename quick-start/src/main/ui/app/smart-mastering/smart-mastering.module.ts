import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MdlModule } from '@angular-mdl/core';

import { SmartMasteringService } from './smart-mastering.service';

@NgModule({
  declarations: [
  ],
  entryComponents: [],
  imports: [
    BrowserModule,
    FormsModule,
    MdlModule,
    RouterModule
  ],
  exports: [
  ],
  providers: [
    SmartMasteringService
  ]
})
export class SmartMasteringModule { }
