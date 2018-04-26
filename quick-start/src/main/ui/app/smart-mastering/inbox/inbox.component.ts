import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { tap } from 'rxjs/operators';
import { SmartMasteringService } from '../smart-mastering.service';
import { MdlDialogService } from '@angular-mdl/core';

import * as _ from 'lodash';

@Component({
  selector: 'app-sm-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class SmartMasteringInboxComponent implements OnInit {
  total = 0;
  pageSize = 5;
  start = 1;
  items = [];

  checked = {};

  get allChecked() {
    return _.size(_.filter(this.checked, c => !!c)) === this.items.length;
  }

  get someChecked() {
    return _.size(_.filter(this.checked, c => !!c)) > 0;
  }

  toggleAll() {
    const checked = !this.allChecked;
    this.items.forEach(item => {
      this.checked[item.meta.uri] = checked;
    });
  }

  toggle(item) {
    this.checked[item.meta.uri] = !this.checked[item.meta.uri];
  }

  constructor(
    private sm: SmartMasteringService,
    private dialogService: MdlDialogService,
    private router: Router
  ) {}

  ngOnInit() {
    this.getItems(this.start);
  }

  compareItems(item) {
    this.sm.markAs([item.meta.uri], 'read').subscribe(() => {
      const uris: string[] = item.uris.map(u => u.uri);
      this.router.navigate(['/compare'], {
        queryParams: {
          uris
        }
      });
    });
  }

  delete() {
    this.dialogService.confirm('Really Delete?', 'Cancel', 'Delete').subscribe(() => {
      const deleteUs = [];
      _.each(this.checked, (checked, uri) => {
        deleteUs.push(uri);
      });
      this.sm.deleteNotifications(deleteUs).subscribe(() => {
        this.getItems(this.start);
      });
    },
    () => {});
  }

  pageChanged(page) {
    const start: number = (page - 1) * this.pageSize + 1;
    this.getItems(start);
  }

  getItems(start: number) {
    this.sm.getInboxItems(start, this.pageSize).subscribe(response => {
      this.items = response.notifications;
      this.start = response.start;
      this.pageSize = response['page-size'];
      this.total = response.total;
    });
  }

  markRead() {
    const uris = _.map(this.checked, (checked, uri) => uri);
    this.sm.markAs(uris, 'read').subscribe(() => {
      this.getItems(this.start);
    });
  }

  markUnread() {
    const uris = _.map(this.checked, (checked, uri) => uri);
    this.sm.markAs(uris, 'unread').subscribe(() => {
      this.getItems(this.start);
    });
  }
}
