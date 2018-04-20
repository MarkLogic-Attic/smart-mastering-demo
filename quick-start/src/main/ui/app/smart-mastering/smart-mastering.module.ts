import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MdlModule } from '@angular-mdl/core';
import { NgDragDropModule } from 'ng-drag-drop';
import { PaginationModule } from '../pagination/pagination.module';
import { FacetsModule } from '../facets/facets.module';
import { PipesModule } from '../pipes/pipes.module';
import { DatePipeModule } from '../date-pipe/date-pipe.module';
import { SmartMasteringService } from './smart-mastering.service';
import { CompareComponent } from './compare/compare.component';
import { SmartMasteringSearchComponent } from './search/search.component';
import { SmartMasteringDocViewerComponent } from './doc-viewer/doc-viewer.component';
import { SmartMasteringInboxComponent } from './inbox/inbox.component';

@NgModule({
  declarations: [
    CompareComponent,
    SmartMasteringSearchComponent,
    SmartMasteringDocViewerComponent,
    SmartMasteringInboxComponent
  ],
  entryComponents: [],
  imports: [
    BrowserModule,
    FormsModule,
    MdlModule,
    NgDragDropModule,
    RouterModule,
    PaginationModule,
    FacetsModule,
    PipesModule,
    DatePipeModule
  ],
  exports: [
    CompareComponent,
    SmartMasteringSearchComponent,
    SmartMasteringDocViewerComponent,
    SmartMasteringInboxComponent
  ],
  providers: [
    SmartMasteringService
  ]
})
export class SmartMasteringModule { }
