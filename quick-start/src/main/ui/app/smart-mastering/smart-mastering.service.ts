import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { SearchResponse } from '../search';

@Injectable()
export class SmartMasteringService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get<any>('/api/mastering/stats');
  }

  getDoc(docUri: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');
    const options: {
      observe: 'response';
      headers: HttpHeaders;
      responseType: 'text'
    } = {
      headers: headers,
      observe: 'response',
      responseType: 'text'
    };
    return this.http.get(`/api/mastering/doc?docUri=${docUri}`, options)
    .map(resp => resp.body);
  }

  merge(doc1: string, doc2: string, optionsName: string) {
    const url = `/api/mastering/merge?doc1=${doc1}&doc2=${doc2}&options=${optionsName}`;
    return this.http.post<any>(url, null);
  }

  search(query: string, activeFacets: any, page: number, pageLength: number) {
    let start: number = (page - 1) * pageLength + 1;
    let data = {
      query: query,
      start: start,
      count: pageLength,
    };

    let facets = {};
    for (let key of Object.keys(activeFacets)) {
      if (activeFacets[key].values) {
        facets[key] = []
      }
      for (let value of activeFacets[key].values) {
        facets[key].push(value);
      }
    }

    data['facets'] = facets;

    return this.http.post<SearchResponse>(`/api/mastering/search`, data);
  }

  getHistoryDocument(uri: string) {
    return this.http.get<any>(`/api/mastering/history-document?uri=${uri}`);
  }

  getHistoryProperties(uri: string) {
    return this.http.get<any>(`/api/mastering/history-properties?uri=${uri}`);
  }
}
