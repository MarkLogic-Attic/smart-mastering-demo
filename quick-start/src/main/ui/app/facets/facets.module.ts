import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MdlModule } from '@angular-mdl/core';
import { PipesModule } from '../pipes/pipes.module';
import { FacetsComponent } from './facets.component';

@NgModule({
  declarations: [
    FacetsComponent
  ],
  entryComponents: [],
  imports: [
    BrowserModule,
    FormsModule,
    MdlModule,
    RouterModule,
    PipesModule
  ],
  exports: [
    FacetsComponent
  ]
})
export class FacetsModule { }
