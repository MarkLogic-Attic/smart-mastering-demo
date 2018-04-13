import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SmartMasteringService } from '../smart-mastering.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-sm-doc-viewer',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './doc-viewer.component.html',
  styleUrls: ['./doc-viewer.component.scss']
})
export class SmartMasteringDocViewerComponent implements OnInit, OnDestroy {

  private sub: any;
  currentDatabase: string = 'STAGING';
  doc: string = null;
  uri: string;

  constructor(
    private route: ActivatedRoute,
    private sm: SmartMasteringService
  ) {}

  ngOnInit() {
    this.sub = this.route.queryParams.subscribe(params => {
     this.uri = params['docUri'];
     this.currentDatabase = params['database'];
     this.sm.getDoc(this.uri).subscribe(doc => {
       this.doc = this.formatData(doc);
     });
   });
  }

  formatData(data: any) {
    if (_.isObject(data) || _.isArray(data)) {
      return JSON.stringify(data, null, '  ');
    }
    return data;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
