import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SmartMasteringService } from '../smart-mastering.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-sm-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.scss']
})
export class CompareComponent implements OnInit {

  flatten = (arr) => arr.reduce((flat, next) => flat.concat(next), []);

  uri1: string = null;
  uri2: string = null;
  doc1: any = null;
  doc2: any = null;
  optionsName: string = 'mlw-merge';
  mergeBlocked: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sm: SmartMasteringService) {}

  ngOnInit() {
    this.uri1 = this.route.snapshot.queryParamMap.get("uri1");
    this.uri2 = this.route.snapshot.queryParamMap.get("uri2");
    this.sm.getDoc(this.uri1).subscribe(doc => {
      this.doc1 = this.toArray(doc.envelope.instance);
    });

    this.sm.getDoc(this.uri2).subscribe(doc => {
      this.doc2 = this.toArray(doc.envelope.instance);
    });

    this.sm.getBlockedMatchUrls(this.uri1).subscribe((matches: string[]) => {
      this.mergeBlocked = matches.includes(this.uri2);
    })
  }

  toArray(data: any) {
    let a = [];

    if (_.isObject(data)) {
      for (let key in data) {
        if (key !== '_xmlns' && data.hasOwnProperty(key)) {
          var value = data[key];
          if (_.isObject(value)) {
            a.push(this.toArray(value));
          } else if (key !== '$type') {
            a.push({ k: key, v: value });
          }
        }
      }
    }
    else if (_.isArray(data)) {
      data.forEach(d => {
        a.push(this.toArray(d));
      });
    }
    return this.flatten(a);
  }

  getClass(i) {
    if (this.doc1[i].v !== this.doc2[i].v) {
      return 'mismatch';
    }
    return '';
  }

  merge() {
    this.sm.merge(this.uri1, this.uri2, this.optionsName).subscribe(newDoc => {
      const newId = newDoc.envelope.headers.id.toString();
      this.router.navigate(['/view-sm'], { queryParams: {docUri: `/com.marklogic.smart-mastering/merged/${newId}.xml`}});
    });
  }

  blockMatch() {
    this.sm.blockMatch(this.uri1, this.uri2).subscribe(() => {
      this.mergeBlocked = true;
    });
  }

  unblockMatch() {
    this.sm.unblockMatch(this.uri1, this.uri2).subscribe(() => {
      this.mergeBlocked = false;
    });
  }
}
