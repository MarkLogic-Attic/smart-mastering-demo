import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators';
import { SmartMasteringService } from '../smart-mastering.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-sm-compare',
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.scss']
})
export class CompareComponent implements OnInit {

  flatten = (arr) => arr.reduce((flat, next) => flat.concat(next), []);

  blockedMerges: {[id: string]: string[]} = {};

  uris: string[] = [];
  docs: any[] = [];
  optionsName: string = 'mlw-merge';
  mergeBlocked: boolean = false;
  table = {};
  keys = [];
  draggingUri: string = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sm: SmartMasteringService) {}

  ngOnInit() {
    this.uris = this.route.snapshot.queryParamMap.getAll("uris");

    const calls = [];
    this.uris.forEach(uri => {
      calls.push(this.sm.getDoc(uri).pipe(tap(doc => this.docs.push(this.toArray(uri, doc.envelope.instance)))));
      calls.push(this.sm.getBlockedMatchUrls(uri).pipe(tap(urls => this.blockedMerges[uri] = urls)));
    });
    Observable.zip(...calls).subscribe(() => {
      if (this.uris && this.uris.length === 2) {
        this.mergeBlocked = this.blockedMerges[this.uris[0]].includes(this.uris[1]);
      }
    });
  }

  toArray(uri: string, data: any) {
    let a = [];

    if (_.isObject(data)) {
      for (let key in data) {
        if (key !== '_xmlns' && key !== '__prefix' && data.hasOwnProperty(key)) {
          var value = data[key];
          if (_.isObject(value) && !_.isArray(value)) {
            a.push(this.toArray(uri, value));
          } else if (_.isArray(value) && _.isObject(value[0])) {
            a.push(this.toArray(uri, value));
          } else if (key !== '$type') {
            if (!this.keys.includes(key)) {
              this.keys.push(key);
            }
            this.table[uri] = this.table[uri] || {};
            if (this.table[uri][key]) {
              this.table[uri][key] = [this.table[uri][key], value];
            } else {
              this.table[uri][key] = value;
            }
            a.push({ k: key, v: value });
          }
        }
      }
    }
    else if (_.isArray(data)) {
      data.forEach(d => {
        a.push(this.toArray(uri, d));
      });
    }
    return this.flatten(a);
  }

  getClass(key) {
    let match = true;
    if (this.table && this.table[this.uris[0]]) {
      let value = this.table[this.uris[0]][key];

      this.uris.forEach(uri => {
        match = match && this.table && this.table[uri] && (this.table[uri][key] === value);
      })
    }
    return match ? '' : 'mismatch';
  }

  merge() {
    if (this.uris.length !== 2) {
      return;
    }
    this.sm.merge(this.uris[0], this.uris[1], this.optionsName).subscribe(newDoc => {
      const newId = newDoc.envelope.headers.id.toString();
      this.router.navigate(['/view-sm'], { queryParams: {docUri: `/com.marklogic.smart-mastering/merged/${newId}.xml`}});
    });
  }

  blockMatch() {
    if (this.uris.length !== 2) {
      return;
    }
    this.sm.blockMatch(this.uris[0], this.uris[1]).subscribe(() => {
      this.mergeBlocked = true;
    });
  }

  unblockMatch() {
    if (this.uris.length !== 2) {
      return;
    }
    this.sm.unblockMatch(this.uris[0], this.uris[1]).subscribe(() => {
      this.mergeBlocked = false;
    });
  }

  getValue(uri, key) {
    if (this.table && this.table[uri]) {
      return this.table[uri][key];
    }

    return '';
  }

  onDragStart(uri) {
    this.draggingUri = uri;
  }

  onDrop(destUri, $event) {
    this.sm.merge($event.dragData, destUri, this.optionsName).subscribe(newDoc => {
      const newId = newDoc.envelope.headers.id.toString();
      const newUri = `/com.marklogic.smart-mastering/merged/${newId}.xml`;
      this.toArray(newUri, newDoc.envelope.instance);
      const destIndex = this.uris.indexOf(destUri);
      this.uris[destIndex] = newUri;
      this.uris = this.uris.filter(uri => (uri !== destUri && uri != $event.dragData));
      delete this.table[$event.dragData];
      delete this.table[destUri];
    });
  }

  allOthers(uri) {
    return this.uris.filter(u => u !== uri);
  }
}
