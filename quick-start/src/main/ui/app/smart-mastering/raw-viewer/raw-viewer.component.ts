import { Component, HostListener, Inject, ViewEncapsulation } from '@angular/core';
import { MdlDialogReference } from '@angular-mdl/core';

require('codemirror/mode/xquery/xquery');
require('codemirror/mode/javascript/javascript');

import * as _ from 'lodash';

@Component({
  selector: 'app-sm-raw-viewer',
  templateUrl: './raw-viewer.component.html',
  styleUrls: ['./raw-viewer.component.scss']
})
export class SmartMasteringRawViewerComponent {
  doc: any;

  codeMirrorConfig = {
    lineNumbers: true,
    indentWithTabs: true,
    lineWrapping: true,
    readOnly: true,
    cursorBlinkRate: 0
  };

  constructor(
    private dialog: MdlDialogReference,
    @Inject('doc') doc: any
  ) {
    this.doc = doc;
  }

  hide() {
    this.dialog.hide();
  }

  @HostListener('keydown.esc')
  public onEsc(): void {
    this.cancel();
  }

  cancel() {
    this.hide();
  }
}
