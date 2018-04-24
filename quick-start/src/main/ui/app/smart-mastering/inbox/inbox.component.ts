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
  items = [];

  constructor(
    private sm: SmartMasteringService,
    private dialogService: MdlDialogService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sm.getInboxItems().subscribe(response => {
      this.items = response.notifications;
      this.total = response.total;
    });
  }

  compareItems(item) {
    const uris: string[] = item.uris.map(u => u.uri);
    this.router.navigate(['/compare'], {
      queryParams: {
        uris
      }
    });
  }

  delete(item) {
    this.dialogService.confirm('Really Delete?', 'Cancel', 'Delete').subscribe(() => {
      this.sm.deleteNotification(item).subscribe(() => {
        this.items = this.items.filter(i => i !== item);
      });
    },
    () => {});
  }
}
