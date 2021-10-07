import { Injectable } from '@angular/core';
declare var require;
@Injectable({
  providedIn: 'root'
})
export class TripService {
  json = require('./resp.json');
   timeAdj = [];
  costAdj = [];
  timeHeader = [];
  costHeader = [];
  shortCost;
  shortTime;
  initAdj() {
     this.json.deals.forEach((item) => {
      this.findCost(item);
      this.findTime(item);
    });
    const sources = this.shortTime
      .map((item) => item.departure)
      .filter((item, i, arr) => arr.indexOf(item) === i);
    const arrival = this.shortTime
      .map((item) => item.arrival)
      .filter((item, i, arr) => arr.indexOf(item) === i);
    this.timeHeader = [...sources, ...arrival].filter(
      (item, i, arr) => arr.indexOf(item) === i
    );
    const sources1 = this.shortCost
      .map((item) => item.departure)
      .filter((item, i, arr) => arr.indexOf(item) === i);
    const arrival1 = this.shortCost
      .map((item) => item.arrival)
      .filter((item, i, arr) => arr.indexOf(item) === i);
    this.costHeader = [...sources1, ...arrival1].filter(
      (item, i, arr) => arr.indexOf(item) === i
    );

    this.makeTimeAdj();
    this.makeCostAdj();
  }
   findTime(node) {
    if (!this.shortTime) {
      this.shortTime = [node];
    } else {
      const current = this.shortTime.findIndex(
        (item) =>
          item.departure === node.departure && item.arrival === node.arrival
      );
      if (current < 0) {
        this.shortTime.push(node);
      } else {
        let time =
          parseInt(this.shortTime[current].duration.h) * 60 +
          parseInt(this.shortTime[current].duration.m);
        if (parseInt(node.duration.h) * 60 + parseInt(node.duration.m) < time)
          this.shortTime[current] = node;
      }
    }
  }
  findCost(node) {
    if (!this.shortCost) {
      this.shortCost = [node];
    } else {
      const current = this.shortCost.findIndex(
        (item) =>
          item.departure === node.departure && item.arrival === node.arrival
      );
      if (current < 0) {
        this.shortCost.push(node);
      } else {
        let cost =
          (100 - parseInt(this.shortCost[current].discount)) *
          parseInt(this.shortCost[current].cost);
        if ((100 - parseInt(node.discount)) * parseInt(node.cost) < cost)
          this.shortCost[current] = node;
      }
    }
  }

   makeTimeAdj() {
    // console.log(this.shortTime)
    this.timeAdj = new Array(this.timeHeader.length)
      .fill(0)
      .map(() => new Array(this.timeHeader.length).fill(0));

    this.shortTime.forEach((item) => {
      const time = parseInt(item.duration.h) * 60 + parseInt(item.duration.m);
      const x = this.timeHeader.indexOf(item.departure);
      const y = this.timeHeader.indexOf(item.arrival);

      this.timeAdj[x][y] = time;
    });
  }
  makeCostAdj() {
    this.costAdj = new Array(this.costHeader.length)
      .fill(0)
      .map(() => new Array(this.costHeader.length).fill(0));
    this.shortCost.forEach((item) => {
      const cost = (100 - parseInt(item.discount)) * parseInt(item.cost);
      const x = this.costHeader.indexOf(item.departure);
      const y = this.costHeader.indexOf(item.arrival);

      this.costAdj[x][y] = cost;
    });
  }

  dijkstra(adjacencyMatrix, startVertex) {
    let nVertices = adjacencyMatrix[0].length;

    let shortestDistances = new Array(nVertices);

    let added = new Array(nVertices);

    for (let vertexIndex = 0; vertexIndex < nVertices; vertexIndex++) {
      shortestDistances[vertexIndex] = Number.MAX_VALUE;
      added[vertexIndex] = false;
    }
    shortestDistances[startVertex] = 0;

    let parents = new Array(nVertices);

    parents[startVertex] = -1;

    for (let i = 1; i < nVertices; i++) {
      let nearestVertex = -1;
      let shortestDistance = Number.MAX_VALUE;
      for (let vertexIndex = 0; vertexIndex < nVertices; vertexIndex++) {
        // console.log('-->',vertexIndex)
        // console.log('--$',shortestDistances)
        if (
          !added[vertexIndex] &&
          shortestDistances[vertexIndex] < shortestDistance
        ) {
          nearestVertex = vertexIndex;
          shortestDistance = shortestDistances[vertexIndex];
          //  console.log('x>',shortestDistances)
        }
      }
      // console.log('--')
      added[nearestVertex] = true;
      for (let vertexIndex = 0; vertexIndex < nVertices; vertexIndex++) {
        let edgeDistance = adjacencyMatrix[nearestVertex][vertexIndex];
        //  console.log('*',edgeDistance,shortestDistance)
        //  console.log('**',shortestDistances)
        if (
          edgeDistance > 0 &&
          shortestDistance + edgeDistance < shortestDistances[vertexIndex]
        ) {
          parents[vertexIndex] = nearestVertex;
          shortestDistances[vertexIndex] = shortestDistance + edgeDistance;
        }
      }
    }
    return { startVertex, shortestDistances, parents };
  }
  getCurrency() {
    return this.json.currency;
  }
  formatPath( parentArr, end, time = true) {
    let source = end;
    const route = [];
    const data = time ? this.shortTime : this.shortCost;
    const header = time ? this.timeHeader : this.costHeader;
    while (parentArr[source] !== -1) {
      const arrival = source;
      const departure = parentArr[source];
      const node = data.find(
        (item) =>
          item.departure === header[departure] &&
          item.arrival === header[arrival]
      );
      route.unshift(node);
      source = parentArr[source];
    }
   return route;
  }
  findPath(source,destination,mode) {
    let obj ;
    if(mode === 'cost') {
        obj = this.dijkstra(this.costAdj,source);
    }else {
       obj = this.dijkstra(this.timeAdj,source);
    }
    return this.formatPath(obj.parents,destination,mode==='cost');

  }
  findHeader(mode):any[] {
    if(!mode) {
      return [];
    }
    if(mode === 'cost') {
      return this.costHeader ? this.costHeader : [];
    }
    if(mode === 'time') {
       return this.timeHeader ? this.timeHeader : [];
    }
    return [];
  }
}
