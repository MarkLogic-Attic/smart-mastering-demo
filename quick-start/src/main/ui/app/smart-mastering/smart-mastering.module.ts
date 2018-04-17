import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MdlModule } from '@angular-mdl/core';
import { PaginationModule } from '../pagination/pagination.module';
import { FacetsModule } from '../facets/facets.module';
import { PipesModule } from '../pipes/pipes.module';
import { SmartMasteringService } from './smart-mastering.service';
import { CompareComponent } from './compare/compare.component';
import { SmartMasteringSearchComponent } from './search/search.component';
import { SmartMasteringDocViewerComponent } from './doc-viewer/doc-viewer.component';

@NgModule({
  declarations: [
    CompareComponent,
    SmartMasteringSearchComponent,
    SmartMasteringDocViewerComponent
  ],
  entryComponents: [],
  imports: [
    BrowserModule,
    FormsModule,
    MdlModule,
    RouterModule,
    PaginationModule,
    FacetsModule,
    PipesModule
  ],
  exports: [
    CompareComponent,
    SmartMasteringSearchComponent,
    SmartMasteringDocViewerComponent
  ],
  providers: [
    SmartMasteringService
  ]
})
export class SmartMasteringModule { }
