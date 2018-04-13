import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SmartMasteringService } from '../smart-mastering.service';
import { SearchResponse } from '../../search';

import * as _ from 'lodash';

@Component({
  selector: 'app-sm-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SmartMasteringSearchComponent implements OnDestroy, OnInit {

  private sub: any;
  entitiesOnly: boolean = false;
  searchText: string = null;
  activeFacets: any = {};
  currentPage: number = 1;
  pageLength: number = 10;
  loadingTraces: boolean = false;
  searchResponse: SearchResponse;
  runningFlows: Map<number, string> = new Map<number, string>();
  selectedResults: any[] = [];
  constructor(
    private sm: SmartMasteringService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.route.queryParams.subscribe(params => {
      this.searchText = params['q'];
      this.currentPage = params['p'] ? parseInt(params['p']) : this.currentPage;
      this.pageLength = params['pl'] || this.pageLength;

      for (let facet of Object.keys(params)) {
        if (!_.includes(['q', 'p', 'pl'], facet) && params[facet]) {
          this.activeFacets[facet] = {
            values: [params[facet]]
          };
        }
      }
      this.getResults();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  pageChanged(page: number) {
    this.currentPage = page;
    this.runQuery();
  }

  showDoc(database: string, docUri: string) {
    this.router.navigate(['/view'], {
      queryParams: {
        database: database,
        docUri: docUri
      }
    });
  }

  doSearch(): void {
    this.currentPage = 1;
    this.runQuery();
  }

  private runQuery(): void {
    let params = {
      p: this.currentPage
    };
    if (this.searchText) {
      params['q'] = this.searchText;
    }

    Object.keys(this.activeFacets).forEach((key) => {
      if (this.activeFacets[key] && this.activeFacets[key].values && this.activeFacets[key].values.length > 0) {
        params[key] = this.activeFacets[key].values[0];
      }
    });

    this.router.navigate(['/search'], {
      queryParams: params
    }).then((result: boolean) => {
      if (result !== true) {
        this.getResults();
      }
    });
  }

  private getResults(): void {
    this.loadingTraces = true;
    this.sm.search(
      this.searchText,
      this.activeFacets,
      this.currentPage,
      this.pageLength
    ).subscribe(response => {
      this.searchResponse = response;
    },
    () => {},
    () => {
      this.loadingTraces = false;
    });
  }

  updateFacets() {
    this.doSearch();
  }

  toggleItemCompare(item) {
    let index = this.selectedResults.indexOf(item);
    if (index > -1) {
      this.selectedResults.splice(index, 1);
    } else if (this.selectedResults.length < 2) {
      this.selectedResults.push(item);
    }
  }

  compareItems() {
    this.router.navigate(['/compare'], {
      queryParams: {
        uri1: this.selectedResults[0].uri,
        uri2: this.selectedResults[1].uri
      }
    });
  }

  getMatcherPath(s: string) {
    return s.replace(/^.+\/([^\/]+)$/, '$1');
  }
}
