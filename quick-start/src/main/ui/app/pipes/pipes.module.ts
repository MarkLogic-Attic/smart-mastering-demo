import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ObjectToArrayPipe } from './object-to-array.pipe';
import { TruncateCharactersPipe } from './truncate.pipe';

@NgModule({
  declarations: [
    ObjectToArrayPipe,
    TruncateCharactersPipe
  ],
  exports: [
    ObjectToArrayPipe,
    TruncateCharactersPipe
  ]
  // providers: [ObjectToArrayPipe]
})
export class PipesModule { }
