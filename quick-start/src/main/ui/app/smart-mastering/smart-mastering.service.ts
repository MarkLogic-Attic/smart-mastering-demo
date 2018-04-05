import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class SmartMasteringService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get<any>('/api/mastering/stats');
  }
}
