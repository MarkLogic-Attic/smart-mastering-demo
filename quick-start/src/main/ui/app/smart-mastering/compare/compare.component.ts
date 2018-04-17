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

  constructor(
    private route: ActivatedRoute,
    private sm: SmartMasteringService) {}

  ngOnInit() {
    this.uri1 = this.route.snapshot.queryParamMap.get("uri1");
    this.uri2 = this.route.snapshot.queryParamMap.get("uri2");
    this.sm.getDoc(this.uri1).subscribe(doc => {
      this.doc1 = this.toArray(doc);
    });

    this.sm.getDoc(this.uri2).subscribe(doc => {
      this.doc2 = this.toArray(doc);
    });
  }

  toArray(data: any) {
    let a = [];

    if (_.isObject(data)) {
      for (let key in data) {
        if (data.hasOwnProperty(key)) {
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
    this.sm.merge(this.uri1, this.uri2, this.optionsName).subscribe(() => {

    });
  }

  notMatch() {

  }
}
