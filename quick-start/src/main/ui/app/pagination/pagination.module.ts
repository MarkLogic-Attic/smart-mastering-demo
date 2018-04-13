import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MdlModule } from '@angular-mdl/core';
import { PaginationComponent } from './pagination.component';

@NgModule({
  declarations: [
    PaginationComponent
  ],
  entryComponents: [],
  imports: [
    BrowserModule,
    FormsModule,
    MdlModule,
    RouterModule
  ],
  exports: [
    PaginationComponent
  ]
})
export class PaginationModule { }
