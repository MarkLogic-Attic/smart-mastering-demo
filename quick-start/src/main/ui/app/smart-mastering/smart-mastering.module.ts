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
import { CodeMirrorModule } from '../codemirror';
import { SmartMasteringService } from './smart-mastering.service';
import { CompareComponent } from './compare/compare.component';
import { SmartMasteringSearchComponent } from './search/search.component';
import { SmartMasteringDocViewerComponent } from './doc-viewer/doc-viewer.component';
import { SmartMasteringInboxComponent } from './inbox/inbox.component';
import { SmartMasteringRawViewerComponent } from './raw-viewer/raw-viewer.component';

@NgModule({
  declarations: [
    CompareComponent,
    SmartMasteringSearchComponent,
    SmartMasteringDocViewerComponent,
    SmartMasteringInboxComponent,
    SmartMasteringRawViewerComponent
  ],
  entryComponents: [
    SmartMasteringRawViewerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    MdlModule,
    NgDragDropModule,
    RouterModule,
    PaginationModule,
    FacetsModule,
    PipesModule,
    DatePipeModule,
    CodeMirrorModule
  ],
  exports: [
    CompareComponent,
    SmartMasteringSearchComponent,
    SmartMasteringDocViewerComponent,
    SmartMasteringInboxComponent,
    SmartMasteringRawViewerComponent
  ],
  providers: [
    SmartMasteringService
  ]
})
export class SmartMasteringModule { }
