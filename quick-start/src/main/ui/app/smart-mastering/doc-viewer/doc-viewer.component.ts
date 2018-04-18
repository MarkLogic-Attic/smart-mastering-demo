import { Component, ElementRef, OnInit, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { tap, merge, mergeAll, zip } from 'rxjs/operators';
import { SmartMasteringService } from '../smart-mastering.service';

import * as _ from 'lodash';

import * as d3 from 'd3';
import * as d3_sankey from 'd3-sankey';
import * as d3_scale from 'd3-scale';
import * as d3_scale_chromatic from 'd3-scale-chromatic';

@Component({
  selector: 'app-sm-doc-viewer',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './doc-viewer.component.html',
  styleUrls: ['./doc-viewer.component.scss']
})
export class SmartMasteringDocViewerComponent implements OnInit {
  private sub: any;
  doc: any = null;
  historyDocument: any = null;
  historyProperties: any = null;
  sourceUris: any[] = null;
  uri: string;

  @ViewChild('provSankey') sanKeyDiv: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sm: SmartMasteringService
  ) {}

  ngOnInit() {
    this.uri = this.route.snapshot.queryParamMap.get('docUri');

    const o1 = this.sm.getDoc(this.uri).pipe(tap(doc => {
      this.doc = this.formatDoc(doc);
    }));


    const o2 = this.sm.getHistoryDocument(this.uri).pipe(
      tap(history => {
        this.historyDocument = history;
        this.sourceUris = this.historyDocument.activities.reduce((sourceUris, activity) => {
          if (activity.type === 'merge') {
            sourceUris = _.union(sourceUris, activity.wasDerivedFromUris);
          }
          return sourceUris;
        }, []);
      })
    );

    const o3 = this.sm.getHistoryProperties(this.uri).pipe(tap(history => {
      this.historyProperties = history;
    }));

    Observable.zip(o1, o2, o3, () => {}).subscribe(() => {
      this.render();
    });
  }

  formatDoc(detail) {
    const result: any = {};
    const personDetail = detail.envelope.instance.MDM.Person.PersonType;
    result.names = coerceToArray(personDetail.PersonName).map(name => (
      name.PersonNameType
    ));
    result.addresses = coerceToArray(personDetail.Address).map(address => (
      address.AddressType
    ));
    result.ssns = coerceToArray(personDetail.PersonSSNIdentification).map(ssn => (
      ssn.PersonSSNIdentificationType.IdentificationID
    ));
    if (personDetail.Revenues) {
      result.revenues = coerceToArray(personDetail.Revenues).map(revenue => (
        revenue.RevenuesType.Revenue
      ));
    } else {
      result.revenues = [];
    }
    result.birthDates = coerceToArray(personDetail.PersonBirthDate);
    result.caseStartDates = coerceToArray(personDetail.CaseStartDate);
    result.caseAmounts = coerceToArray(personDetail.CaseAmount);
    return result;
  }

  render() {
    const links = [];
    let activities = [{
        resultUri: this.uri
      }];
    if (this.historyDocument) {
      activities = this.historyDocument.activities;
    }
    const nodeUris = activities.filter((activity:any) => activity.type != 'rollback').map((activity) => activity.resultUri);
    const nodeUriSources = {
      'final': 'final'
    };
    if (this.historyProperties) {
      for (const propertyName in this.historyProperties) {
        if (!this.historyProperties.hasOwnProperty(propertyName)) {
          continue;
        }
        const propertyValues = this.historyProperties[propertyName];
        for (const propertyValue in propertyValues) {
          if (!propertyValues.hasOwnProperty(propertyValue)) {
            continue;
          }
          links.push({
            source: 0,
            target: nodeUris.length,
            value: 1,
            propertyID: encodeURIComponent('final-' + Math.random()),
            sourceName: 'final',
            propertyName: propertyName,
            propertyValue: propertyValue
          });
          let propertyValueDetails = propertyValues[propertyValue].details;
          propertyValueDetails = Array.isArray(propertyValueDetails) ? propertyValueDetails : [propertyValueDetails];
          propertyValueDetails.forEach(function(detail) {
            let indexOfDerivedFrom =  nodeUris.indexOf(detail.sourceLocation);
            if (indexOfDerivedFrom < 0) {
              indexOfDerivedFrom = nodeUris.length;
              nodeUris.push(detail.sourceLocation);
            }
            nodeUriSources[detail.sourceLocation] = detail.sourceName;
            if (indexOfDerivedFrom !== 0) {
              links.push({
                source: indexOfDerivedFrom,
                target: 0,
                value: 1,
                propertyID: Math.random(),
                sourceName: detail.sourceName,
                propertyName: propertyName,
                propertyValue: propertyValue
              });
            }
          });
        }
      }
      const pendingObservables = [];
      activities.forEach((activity: any, activityIndex) => {
        const hasConnection = links.some(l => {
            return l.source === activityIndex || l.target === activityIndex;
          });
        if (!hasConnection) {
          const checkForLinkedActivityIndex = function(linkedActivity, linkedActivityIndex, activitiesArray) {
            const wasDerivedFrom = linkedActivity !== activity &&
              (linkedActivity.wasDerivedFromUris.includes(activity.resultUri) || (
              linkedActivity.wasDerivedFromUris.length === 0 && linkedActivity.resultUri === activity.resultUri));
            const occurredAfter = linkedActivity.time > activity.time;
            if (wasDerivedFrom && occurredAfter) {
              const matchExistsLater = activitiesArray.slice(linkedActivityIndex + 1).findIndex(checkForLinkedActivityIndex) > -1;
              return !matchExistsLater;
            } else {
              return false;
            }
          };
          const connectionIndex = activities.findIndex(checkForLinkedActivityIndex);
          if (connectionIndex > -1) {
            const linkedDocPropertyHistory = this.sm.getHistoryProperties(activity.resultUri).pipe(
              tap(payload =>  {
                for (const propertyName in payload) {
                  if (!payload.hasOwnProperty(propertyName)) {
                    continue;
                  }
                  const propertyValues = payload[propertyName];
                  for (const propertyValue in propertyValues) {
                    if (!propertyValues.hasOwnProperty(propertyValue)) {
                      continue;
                    }
                    let propertyValueDetails = propertyValues[propertyValue].details;
                    propertyValueDetails = Array.isArray(propertyValueDetails) ? propertyValueDetails : [propertyValueDetails];
                    propertyValueDetails.forEach(function(detail) {
                      links.push({
                        source: activityIndex,
                        target: connectionIndex,
                        value: 1,
                        propertyID: detail.propertyID,
                        sourceName: detail.sourceName,
                        propertyName: propertyName,
                        propertyValue: propertyValue
                      });
                    });
                  }
                }
              })
            );
            pendingObservables.push(linkedDocPropertyHistory);
          }
        }
      });

      if (pendingObservables.length > 0) {
        Observable.zip(...pendingObservables).subscribe(() => {
          this.drawNodes(activities, nodeUriSources, links);
        });
      } else {
        this.drawNodes(activities, nodeUriSources, links);
      }
    }
  }

  drawNodes(activities, nodeUriSources, links) {
    const margin = {top: 50, right: 50, bottom: 50, left: 50},
      width = window.innerWidth - margin.left - margin.right,
      height = window.innerHeight - margin.top - margin.bottom;
    const color = d3_scale.scaleOrdinal(d3_scale_chromatic.schemePaired);
    const svg = d3.select(this.sanKeyDiv.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');
    const sankey = d3_sankey.sankey()
      .nodeWidth(36)
      .nodePadding(40)
      .size([width, height]);
    const nodes = activities.map((activity: any) => {
      const nodeSource = nodeUriSources[activity.resultUri];
      return { name: activity.resultUri, sourceName: activity.type + (nodeSource ? (':' + nodeSource) : '' )};
    });

    nodes.push({
      name: 'final',
      sourceName: 'final'
    });
    // add in the links
    const graph = sankey({ nodes: nodes, links: links });
    const link = svg.append('g').selectAll('.link')
        .data(graph.links)
      .enter().append('path')
        .attr('class', 'link')
        .attr('d', d3_sankey.sankeyLinkHorizontal())
        .attr('id', function(d) { return d.propertyID; })
        .attr('stroke-width', function(d) { return Math.max(1, d.width); });

    // add the link titles
    link.append('title')
          .text(function(d) {
          return d.sourceName + ': ' + d.propertyName + '("' + d.propertyValue + '") → ' +
                  d.target.name; });
    // add in text
    svg.append('g').selectAll('.linkText')
        .data(graph.links)
      .enter()
      .append('text')
      .attr('dy', '0.35em')
      .append('textPath')
      .attr('xlink:href', function(d) { return '#' + d.propertyID; })
      .text(function(d) { return d.propertyName + ':"' + d.propertyValue + '"'; });

    // add in the nodes
    const node = svg.append('g').selectAll('.node')
        .data(graph.nodes)
      .enter().append('g')
      .attr('transform', function(d) {
          return 'translate(' + d.x0 + ',' + d.y0 + ')';
      });

    // add the rectangles for the nodes
    node.append('rect')
      .attr('height', function(d) { return d.y1 - d.y0; })
      .attr('width', function(d) { return d.x1 - d.x0; })
      .attr('fill', function(d) {
        return color(d.name.replace(/ .*/, ''));
      })
      .attr('stroke', '#000');
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('transform', function (d) {
         return 'rotate(-90) translate(' +
           ((d.y0 - d.y1) / 2) +
           ', ' +
           (sankey.nodeWidth() / 2 + 5) +
           ')';
      })
      .text(function(d) {
        const computedWidth = d.y1 - d.y0;
        const truncatedLabel = d.sourceName.slice(0, computedWidth / 10);
        return truncatedLabel + (truncatedLabel.length < d.sourceName.length ? '...' : '');
      });

      node.append('title')
        .text(function(d) { return d.sourceName + ': ' + d.name; });
  }

  unmerge() {
    this.sm.unmerge(this.uri).subscribe(() => this.router.navigate(['/search']));
  }
}

const coerceToArray = data => {
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
};
