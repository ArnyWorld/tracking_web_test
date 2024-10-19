import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ServicioApi } from './servicio-api';

import { transform, fromLonLat } from 'ol/proj';
import * as olSphere from 'ol/sphere';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { PointsService } from './points.service';



@Injectable({
  providedIn: 'root',
})
export class RoutesService {
  apiUrl = environment.apiserver;
  apiName = 'routes';
  prefix = '';
  constructor(private http: HttpClient) {}

  setPrefix(prefix: string) {
    this.prefix = prefix;
  }
  toCoord(points: any) {
    let coords = [];
    points.forEach((p: any) => {
      coords.push([p.lon, p.lat]);
    });
    return coords;
  }
  createPolyRouteTrack(route: any) {
    let polyRouteTrack = { splitPointTracks: [] };
    route.sections.forEach((t) => {
      polyRouteTrack.splitPointTracks.push(t.splitCoords);
    });
    return polyRouteTrack;
  }
  setStops(stops,tracks ){
	if (stops == undefined ) return;

  }
  getStops(tracks){
	let stops  = [];
	let isStop = false;
	let stop = null;
	for(let i = 0; i < tracks.length; i++ ){	
		if (!isStop && (parseInt(tracks[i].stp) == 1)){
			stop = {
				start_date:tracks[i].t,
				start_lat:tracks[i].lat,
				start_lon:tracks[i].lon,
				end_date:tracks[i].t,
				end_lat:tracks[i].lat,
				end_lon:tracks[i].lon,
				duration:0,
			};
			stops.push(stop);
			isStop=true;
		}
		if(parseInt(tracks[i].stp) == 0)
			isStop=false;
		if(isStop){
			stop.end_date = tracks[i].t;
			stop.end_lat = tracks[i].lat;
			stop.end_lon = tracks[i].t;
			stop.duration = stop.end_date-stop.start_date;
		}

	}
	return stops;
  }
  checkPoints(route, tracks, maxDistance) {
    if (route == null) return 0;
    if (route.length == 0) return 0;
    let d: number = 0;
    let total = 0.0;
    let noCheckCount = 0.0;
    let i: number, j: number, k: number;
    let sc: any;

    for (i = 0; i < route.sections.length; i++) {
      for (j = 0; j < route.sections[i].splitCoords.length; j++) {
        total++;
        sc = route.sections[i].splitCoords[j];
        if (sc[2] == true) continue;
        noCheckCount++;
        for (k = 0; k < tracks.length; k++) {
          d = olSphere.getDistance(
            [tracks[k].lon, tracks[k].lat],
            [sc[0], sc[1]]
          );
          if (d < maxDistance) {
			route.sections[i].splitCoordsChecked.push(sc);
            sc[2] = true;
          }
        }
      }
    }
    return Math.round(((total - noCheckCount) / total) * 10000) / 100;
  }
  checkPointLast(route, point, maxDistance) {
    if (route == null) return 0;
    if (route.length == 0) return 0;
    let d: number = 0;
    let total = 0.0;
    let noCheckCount = 0.0;
    let i: number, j: number, k: number;
    let sc: any;
    let findIt = false;

    for (i = 0; i < route.sections.length; i++) {
      for (j = 0; j < route.sections[i].splitCoords.length; j++) {
        total++;
        sc = route.sections[i].splitCoords[j];
        if (sc[2] == true) continue;
        noCheckCount++;
        d = olSphere.getDistance([point.lon, point.lat], [sc[0], sc[1]]);
        if (d < maxDistance) {
          sc[2] = true;
		  route.sections[i].splitCoordsChecked.push(sc);
        }
      }
    }
    //return (total-noCheckCount)  + " / " + total;
    return Math.round(((total - noCheckCount) / total) * 10000) / 100;
  }
  calcAdvance(
    PolyRouteTrack: any,
    tracks: any[],
    polyAdvanced: any[],
    calcType: string,
    maxPointDistance
  ) {
    if (calcType == 'VECTORIAL')
      return this.calcAdvanceOne(
        PolyRouteTrack,
        tracks,
        polyAdvanced,
        maxPointDistance
      );
    if (calcType == 'AREA')
      return this.calcAdvanceOmni(
        PolyRouteTrack,
        tracks,
        polyAdvanced,
        maxPointDistance
      );
  }
  groupBy(list, keyGetter) {
    if (list == null) return new Map();
    const map = new Map();
    const mapAr = [];
    list.forEach((item) => {
      const key = keyGetter(item);
      const collection = map.get(key);
      if (!collection) {
        map.set(key, [item]);
        mapAr.push(item);
      } else {
        collection.push(item);
      }
    });
    return map;
  }

  pointsASections(route) {
    route['extend'] = [+180, 90, -180, -90];
    route['sections'] = [];
    route['sections'] = Array.from(
      this.groupBy(route.points, (p) => p.section)
    ).map((p: any, index: number) => {
      return {
        uuid: index,
        coords: p[1].map((pp: any) => {
          route['extend'][0] =
            pp.lon < route['extend'][0] ? pp.lon : route['extend'][0];
          route['extend'][1] =
            pp.lat < route['extend'][1] ? pp.lat : route['extend'][1];
          route['extend'][2] =
            pp.lon > route['extend'][2] ? pp.lon : route['extend'][2];
          route['extend'][3] =
            pp.lat > route['extend'][3] ? pp.lat : route['extend'][3];
          return [pp.lon, pp.lat];
        }),
      };
    });
    const extent = route.extend;
    const corner1 = transform([extent[0], extent[1]], 'EPSG:4326', 'EPSG:3857');
    const corner2 = transform([extent[2], extent[3]], 'EPSG:4326', 'EPSG:3857');
    route['extend_3857'] = [corner1[0], corner1[1], corner2[0], corner2[1]];
    route['extend_latlon'] = route['extend'];
    /*	console.log("extend",route['extend']);
		console.log("extend_3857",route['extend_3857']);
		console.log("extend_latlon",route['extend_latlon']);*/
  }

  processExtend(route) {
    route['extend'] = [+180, 90, -180, -90];

    route['sections'].forEach((t) => {
      t.coords.forEach((c) => {
        route['extend'][0] =
          c[0] < route['extend'][0] ? c[0] : route['extend'][0];
        route['extend'][1] =
          c[1] < route['extend'][1] ? c[1] : route['extend'][1];
        route['extend'][2] =
          c[0] > route['extend'][2] ? c[0] : route['extend'][2];
        route['extend'][3] =
          c[1] > route['extend'][3] ? c[1] : route['extend'][3];
      });
    });
    const extent = route.extend;
    const corner1 = transform([extent[0], extent[1]], 'EPSG:4326', 'EPSG:3857');
    const corner2 = transform([extent[2], extent[3]], 'EPSG:4326', 'EPSG:3857');
    route['extend_3857'] = [corner1[0], corner1[1], corner2[0], corner2[1]];
    route['extend_latlon'] = route['extend'];
    //console.log("extend",route['extend']);
    //console.log("extend_3857",route['extend_3857']);
    //console.log("extend_latlon",route['extend_latlon']);
  }

  resizeImage(base64Str): any {
    return new Promise((resolve) => {
      var img = new Image();

      img.onload = function () {
        var canvas = document.createElement('canvas');
        var MAX_WIDTH = 900;
        var MAX_HEIGHT = 900;
        var width = img.width;
        var height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        //console.log("canvas.toDataURL()", canvas.toDataURL("image/jpeg"));
        resolve(canvas.toDataURL('image/jpeg'));
      };

      img.src = base64Str;
    });
  }

  calcAdvanceOmni(
    PolyRouteTrack: any,
    tracks: any[],
    polyAdvanced: any[],
    maxPointDistance
  ) {
    if (PolyRouteTrack == null) return 0;
    if (PolyRouteTrack.length == 0) return 0;
    let currentPointIndex = 0;
    let dist: number = 0;
    let pointPairA = null;
    let pointPairB = null;
    let total = 0.0;
    let checkCount = 0.0;
    PolyRouteTrack.splitPointTracks.forEach((splitPoints: any) => {
      splitPoints.forEach((s) => {
        tracks.forEach((track: any) => {
          total++;
          dist = olSphere.getDistance([track.lon, track.lat], [s[0], s[1]]); //spt.sphericalDistance(t.getLatLong());
          if (!s[2]) {
            if (dist < maxPointDistance) {
              s[2] = true;
              checkCount++;
            }
          }
        });
      });
    });
    let lastIndex: number = 0;

    PolyRouteTrack.splitPointTracks.forEach((splitPoints: any) => {
      let currentPoly = null;
      for (let i = 0; i < splitPoints.length; i++) {
        if (splitPoints[i][2]) {
          //drawPoly(splitPointsTrack.get(i),i);
          if (currentPoly == null) currentPoly = [];
          currentPoly.push([splitPoints[i][0], splitPoints[i][1]]);
        } else {
          if (currentPoly == null) currentPoly = [];
          if (currentPoly.length == 0) {
            const index = polyAdvanced.indexOf(currentPoly);
            polyAdvanced.splice(index, 1);
            //			console.log("index",index);
          }
          currentPoly = [];
          polyAdvanced.push(currentPoly);
        }
      }
      if (currentPoly == null) currentPoly = [];
      if (currentPoly.length > 0) {
        polyAdvanced.push(currentPoly);
      }
    });
    return (checkCount / total) * 100;
  }
  calcAdvanceOmniSimple(
    PolyRouteTrack: any,
    tracks: any[],
    polyAdvanced: any[],
    maxPointDistance
  ) {
    if (PolyRouteTrack == null) return 0;
    if (PolyRouteTrack.length == 0) return 0;
    let currentPointIndex = 0;
    let dist: number = 0;
    let pointPairA = null;
    let pointPairB = null;
    let total = 0.0;
    let checkCount = 0.0;
    let i, j, k;

    for (i = 0; i < PolyRouteTrack.splitPointTracks.length; i++) {
      console.log(
        'PolyRouteTrack.splitPointTracks[i]',
        PolyRouteTrack.splitPointTracks[i]
      );
      for (k = 0; k < tracks.length; k++) {
        total++;
        dist = olSphere.getDistance(
          [tracks[k].lon, tracks[k].lat],
          [
            PolyRouteTrack.splitPointTracks[i][0],
            PolyRouteTrack.splitPointTracks[i][1],
          ]
        ); //spt.sphericalDistance(t.getLatLong());
        if (!PolyRouteTrack.splitPointTracks[i][2]) {
          if (dist < maxPointDistance) {
            PolyRouteTrack.splitPointTracks[i][2] = true;
            checkCount++;
          }
        }
      }
    }

    return (checkCount / total) * 100;
  }
  calcAdvanceOne(
    splitPoints: any,
    tracks: any[],
    polyAdvanced: any[],
    maxPointDistance
  ) {}
  splitPoints(points: any, minDist: number, maxDist: number) {
    let lastPoint = null;
    let acumDist: number = 0;
    let splitPoints = [];
    points.forEach((p: any) => {
      if (lastPoint == null) {
        lastPoint = p;
        splitPoints.push({
          lat: lastPoint.lat,
          lon: lastPoint.lon,
          check: false,
        });
        return;
      }
      let currentDist = olSphere.getDistance(
        [p.lon, p.lat],
        [lastPoint.lon, lastPoint.lat]
      );
      if (currentDist > maxDist) {
        let splitCounts: number =
          (currentDist - (currentDist % maxDist)) / maxDist;
        acumDist = currentDist % maxDist;
        let relDistLat: number = (p.lat - lastPoint.lat) / splitCounts;
        let relDistLon: number = (p.lon - lastPoint.lon) / splitCounts;
        for (let i = 1; i < splitCounts; i++) {
          let tLatLong = {
            lat: lastPoint.lat + relDistLat * i,
            lon: lastPoint.lon + relDistLon * i,
            check: false,
          };
          splitPoints.push(tLatLong);
        }
        let tLatLong = { lat: p.lat, lon: p.lon, check: false };
        splitPoints.push(tLatLong);
        lastPoint = p;
      } else {
        let tLatLong = { lat: p.lat, lon: p.lon, check: false };
        splitPoints.push(tLatLong);
        lastPoint = p;
      }
    });
    return splitPoints;
  }

  	saveRoute(route:any){
	
	}
	sectionToPaths(route:any){
		
		for (let i_section = 0 ;i_section < route.sections.length ; i_section ++ ){
			let section = route.sections[i_section];
			section['smoothPaths'] = []
			section['linePaths'] = []
			let linePathSmooth = [];
			let linePath = [];
			for(let i_coords = 0 ; i_coords < section.coords.length; i_coords++){
				linePathSmooth.push([section.coords[i_coords][0],section.coords[i_coords][1]]);
				linePath.push([section.coords[i_coords][0],section.coords[i_coords][1]]);
			}
			section['smoothPaths'].push(linePathSmooth);
			section['linePaths'].push(linePath);
		}		
	}
	
  	saveRouteGenerated(route:any, pointService:PointsService){
	let route_new = {
		name:route.name+'-S',
		description:'',
		max_split_mt:10,
		min_split_mt:5,
		distance:0,
		frecuency:'',
		color:'#6655ff'
	};
	this.register(route_new).subscribe((result: any) => {
		let route_id = result.content.id;
		let points = [];
		let section_count = 0; 
		route.sections.forEach( (section:any)=>{
			console.log("route saved",result);
			section.smoothPaths.forEach( path => {
				section_count++;
				path.forEach(c=>{					
					points.push({
						route_id:route_id,
						lat:c[1],
						lon:c[0],
						section:section_count,
					});
				});
			})
		});
		console.log("points to register",points);
		pointService.register(points).subscribe((result:any)=>{
			console.log("points saved");
		});
	});
  }
  cellsToRoutePixel(map:any,route:any){
	let pixels = [];
	console.log("route.sections.length",route.sections.length);
	for ( let s_index=0 ;s_index < route.sections.length; s_index ++ ){
		let section = route.sections[s_index];
		for ( let c_index=0 ;c_index < section['splitCoordsCells'].length; c_index ++ ){		
			let cell = section['splitCoordsCells'][c_index];
			
			pixels.push({
				coord : cell,
				pixel : map.instance.getPixelFromCoordinate([cell[0],cell[1]])
			});
		}
	}
	route['pixel'] = pixels;
	console.log("pixels",pixels);
	let cells = route.splitPointsCoordCells;
  }

  splitPointsCoordCells(route:any,extend:any, points: any, minDist: number, maxDist: number ,spaces:number=1,randomY:boolean=true){
	let cells = [];
	/*cells.push( [extend[0],extend[1]], [extend[0],extend[3]], [extend[2],extend[1]], [extend[2],extend[3]]		);*/
	let polygon =  new Polygon([points]);
	let feature = new Feature({	geometry:polygon });

	route['polygon'] = feature;
	
	//polygon.getGeometry().intersectsCoordinate();

	let max_x = 100.0;
	let max_y = 100.0;
	//let step_x = (extend[2]-extend[0])/max_x;
	//let step_y = (extend[3]-extend[1])/max_y;
	/*
	let step_x = 0.00005;
	let step_y = 0.00005;
	let step_y2 = 0.00005*0.75;*/
	let step_x = 0.0001*1;
	let step_y = 0.0001*1;
	let step_y2 = 0.0001*0.45*1;

	max_x = (extend[2]-extend[0])/step_x;
	max_y = (extend[3]-extend[1])/step_y;

	let ini_x = extend[0];
	let ini_y = extend[1];
	//if ( max_x > 0 && max_y >0 && max_x<100 && max_y<100)
	for (let i=0;i<max_x;i++){
		for (let j=0;j<max_y;j++){
			if (feature.getGeometry().intersectsCoordinate([ini_x+i*step_x,ini_y+j*step_y]))
				if (randomY)
					cells.push([ini_x+i*step_x +step_y2*Math.random(),ini_y+j*step_y+step_y2*Math.random(),true,0]);
				else
					cells.push([ini_x+i*step_x +step_y2,ini_y+j*step_y+step_y2,true,0]);
		}
	}

	return cells;	
  }
  
  splitPointsCoord(points: any, minDist: number, maxDist: number) {
    let lastPoint = null;
    let acumDist: number = 0;
    let splitPoints = [];
    //console.log("points",points);
    points.forEach((p: any) => {
      if (lastPoint == null) {
        lastPoint = p;
        splitPoints.push([p[0], p[1], false]);
        return;
      }
      let currentDist = olSphere.getDistance(p, lastPoint);
      if (currentDist > maxDist) {
        let splitCounts: number =
          (currentDist - (currentDist % maxDist)) / maxDist;
        acumDist = currentDist % maxDist;
        let relDistLat: number = (p[1] - lastPoint[1]) / splitCounts;
        let relDistLon: number = (p[0] - lastPoint[0]) / splitCounts;
        for (let i = 1; i < splitCounts; i++) {
          let tLatLong = [
            lastPoint[0] + relDistLon * i,
            lastPoint[1] + relDistLat * i,
            false,
          ];
          splitPoints.push(tLatLong);
        }
        let tLatLong = [p[0], p[1], false,0];
        splitPoints.push(tLatLong);
        lastPoint = p;
      } else {
        let tLatLong = [p[0], p[1], false,0];
        splitPoints.push(tLatLong);
        lastPoint = p;
      }
    });
    return splitPoints;
  }
  register(datos: any) {
    return this.http.post(
      this.apiUrl + this.prefix + `/${this.apiName}`,
      datos
    );
  }

  update(datos: any, id: any): Observable<any> {
    return this.http.put(
      this.apiUrl + this.prefix + `/${this.apiName}/${id}`,
      datos
    );
  }

  find(id: string = '') {
    return this.http
      .get(this.apiUrl + this.prefix + `/${this.apiName}/${id}`)
      .pipe(
        tap((result: any) => {
          let route = result.content;
          route['extend'] = [+180, 90, -180, -90];
          route['sections'] = Array.from(
            this.groupBy(route.points, (p) => p.section)
          ).map((p: any, index: number) => {
            return {
              uuid: index,
              coords: p[1].map((pp: any) => {
                route['extend'][0] =
                  pp.lon < route['extend'][0] ? pp.lon : route['extend'][0];
                route['extend'][1] =
                  pp.lat < route['extend'][1] ? pp.lat : route['extend'][1];
                route['extend'][2] =
                  pp.lon > route['extend'][2] ? pp.lon : route['extend'][2];
                route['extend'][3] =
                  pp.lat > route['extend'][3] ? pp.lat : route['extend'][3];
                return [pp.lon, pp.lat];
              }),
            };
          });
          route['sections'].forEach((t) => {
            t['splitCoords'] = [];// this.splitPointsCoord(t.coords, 4, 30);
			t['splitCoordsChecked'] = [];
          });
		  return result;
        })
      );
  }
	getList(){
		return this.http.get(this.apiUrl + this.prefix + `/${this.apiName}/routelist`).pipe(
			tap((result: any) => {
			  result.content.forEach((route: any) => {
				route['extend'] = [+180, 90, -180, -90];
				route['sections'] = Array.from(
				  this.groupBy(route.points, (p) => p.section)
				).map((p: any, index: number) => {
				  return {
					uuid: index,
					coords: p[1].map((pp: any) => {
					  route['extend'][0] =
						pp.lon < route['extend'][0] ? pp.lon : route['extend'][0];
					  route['extend'][1] =
						pp.lat < route['extend'][1] ? pp.lat : route['extend'][1];
					  route['extend'][2] =
						pp.lon > route['extend'][2] ? pp.lon : route['extend'][2];
					  route['extend'][3] =
						pp.lat > route['extend'][3] ? pp.lat : route['extend'][3];
					  return [pp.lon, pp.lat];
					}),
				  };
				});
				route['sections'].forEach((t) => {
				  t['splitCoords'] = this.splitPointsCoord(t.coords, 4, 30);
				  t['splitCoordsChecked'] = [];
				});
			  });
			  return result;
			})
		  );
	}
  getAll(
    size: number = 300,
    page: number = 1,
    sortBy: string = 'id',
    descending: false,
    keyword: any = ''
  ) {
	if (localStorage.getItem('routes')!=null){
		return {subscribe:(res_=(a)=>{},err_=(a)=>{})=>{			

		let openRequest =  indexedDB.open('store', 1);
			
		openRequest.onupgradeneeded =function(event) {
			let db = openRequest.result;
			if (!db.objectStoreNames.contains('routes')) { 
			db.createObjectStore('routes', {keyPath: 'id'}); 
			}
			console.log("(indexedDB) openRequest.onupgradeneeded created");
		};
		
		openRequest.onerror = function() {
			console.error("Error", openRequest.error);
		};

		let db = null;
		openRequest.onsuccess = function() {
			db = openRequest.result;
			db.onversionchange = function() {
				db.close();
				alert("La base de datos está desactualizada, por favor recargue la página.")
			};
			console.log("(indexedDB) openRequest.onsuccess success");	
			try{	
				
				const transaction = db.transaction("routes", "readwrite"); // (1)
				let routes = transaction.objectStore("routes"); 
				var allRecords = routes.getAll();
				console.log("(indexedDB) getting all");	
				allRecords.onsuccess = function(res) {
					console.log("(indexedDB) onsuccess",res.target.result);	
					console.log("(indexedDB) onsuccess  allRecords.result--",allRecords.result);	
					//console.log("(indexedDB) onsuccess obj",allRecords.result);	
					res_({content:JSON.parse(JSON.stringify(allRecords.result))});
				};
			}catch(e){
				err_("err");
			}
		};
			
		}};
	}else{
		let openRequest =  indexedDB.open('store', 1);
			
		openRequest.onupgradeneeded =function(event) {
			let db = openRequest.result;
			if (!db.objectStoreNames.contains('routes')) { 
			db.createObjectStore('routes', {keyPath: 'id'}); 
			}
			console.log("openRequest.onupgradeneeded created");
		};
		
		openRequest.onerror = function() {
			console.error("Error", openRequest.error);
		};

		let db = null;
		openRequest.onsuccess = function() {
			db = openRequest.result;
			db.onversionchange = function() {
				db.close();
				alert("La base de datos está desactualizada, por favor recargue la página.")
			};
			console.log("openRequest.onsuccess success");
			
			
		};
		let addData = (data)=>{
			
			const transaction = db.transaction("routes", "readwrite"); // (1)
			let routes = transaction.objectStore("routes"); 
			let route = data;//{id:'asd12',name:'route1'};
			let request =  routes.add(route); 
			console.log("openRequest.onupgradeneeded add added");
			console.log(db);
			
			request.onsuccess = ()=> {
				// request.result contains key of the added object
				console.log(`New route added, email: ${request.result}`);
			}
		
			request.onerror = (err)=> {
				console.error(`Error to add new route: ${err}`,err)
			}
		};

		return this.http.get(this.apiUrl + this.prefix + `/${this.apiName}/`).pipe(
		tap(async (result: any) => {		
			let transaction = db.transaction(["routes"], "readwrite"); // (1)
			let routes = transaction.objectStore("routes"); 
			
			result.content.forEach(async (route: any) => {
				
			
			route['extend'] = [+180, 90, -180, -90];
			route['sections'] = Array.from(
				this.groupBy(route.points, (p) => p.section)
			).map((p: any, index: number) => {
				return {
				uuid: index,
				coords: p[1].map((pp: any) => {
					route['extend'][0] =
					pp.lon < route['extend'][0] ? pp.lon : route['extend'][0];
					route['extend'][1] =
					pp.lat < route['extend'][1] ? pp.lat : route['extend'][1];
					route['extend'][2] =
					pp.lon > route['extend'][2] ? pp.lon : route['extend'][2];
					route['extend'][3] =
					pp.lat > route['extend'][3] ? pp.lat : route['extend'][3];
					return [pp.lon, pp.lat];
				}),
				};
			});
			route['sections'].forEach((t) => {
				t['splitCoords'] = this.splitPointsCoord(t.coords, 4, 30);
			});
			route['splitCoordsLine'] = [];
			route['sections'].forEach((t) => {
				t['splitCoordsCells'] = [];
				t['splitCoordsChecked'] = [];
			});
			
			let i,j;
			for (i=0;i<route['sections'].length;i++)
				for (j=0;j<route['sections'][i]['splitCoords'].length;j++)
					route['splitCoordsLine'].push(route['sections'][i]['splitCoords'][j]);
			});


			result.content.forEach(async (route: any) => {				
				let request = await routes.add(route); 
			});

			localStorage.setItem('routes','loaded');
			return result;
		})
		);
	}
  }

  generateCell(route:any,cellSpace, randomY){	
	route['sections'].forEach((t) => {
		t['splitCoordsCells'] = this.splitPointsCoordCells(route,route['extend'],t.coords, 4*2, 30*2,cellSpace, randomY);
		t['splitCoordsChecked'] = [];
	  });
  }
  
  smoothSections(route:any){	
	let sma = (ar,per)=>{
		let sma_values = [];
		for (let i_array=0; i_array<per-1; i_array++ ){
			sma_values.push(ar[i_array]);
		}
		for (let i_array=per-1; i_array<ar.length; i_array++ ){
			let coord = [0,0];
			for (let i_per=0; i_per<per; i_per++ ){
				coord[0]+=ar[i_array-i_per][0];
				coord[1]+=ar[i_array-i_per][1];
			}
			coord[0] = coord[0]/per;
			coord[1] = coord[1]/per;
			sma_values.push(coord);
		}
		return sma_values;
	}
	route['sections'].forEach((s:any) => {		
		s.coords = sma(s.coords,3);
	});
  }
  average(route:any){
	//this.routesService.generateSma(route);		
	let midPoint = (currentCell,parentCell)=>{
		let cell = [parentCell[0]-currentCell[0],parentCell[1]-currentCell[1]];
		cell[0] = currentCell[0]+cell[0]/2;
		cell[1] = currentCell[1]+cell[1]/2;
		cell[2] = currentCell[2];
		cell[3] = currentCell[3];
		cell[4] = currentCell[4];
		return cell;
	}
	let midPoint3 = (currentCell,parentCell,parentCell2)=>{
		let cell = [currentCell[0]+parentCell[0]+parentCell2[0],currentCell[1]+parentCell[1]+parentCell2[1]];
		cell[0] = currentCell[0]/3;
		cell[1] = currentCell[1]/3;
		return cell;
	}
	for(let s_index = 0; s_index < route.sections.length; s_index++ ){
		let section = route.sections[s_index];
		let smoothPaths = [];
		for(let c_index = 0; c_index < section['smoothPaths'].length; c_index++ ){
			
			let linePath = section['smoothPaths'][c_index];
			let smooth_linePath = [] ;
			
			if (linePath.length > 0) smooth_linePath.push(linePath[0]);
			//for(let p_index = 1; p_index < linePath.length; p_index++ ){
			for(let p_index = 1; p_index < linePath.length; p_index++ ){
				if (linePath[p_index][4]!=undefined&& p_index!=linePath.length-1)
					smooth_linePath.push(linePath[p_index]);
				else
					smooth_linePath.push(midPoint(linePath[p_index-1],linePath[p_index]));
				//smooth_linePath.push(midPoint3(linePath[p_index-2],linePath[p_index-1],linePath[p_index]));
			}
			if (linePath.length > 1) smooth_linePath.push(linePath[linePath.length-1]);	

			smoothPaths.push(smooth_linePath);
		}
		section['smoothPaths'] = smoothPaths;
	}
  }
  smoothSectionsSmoothpaths(route:any){	
	let sma = (ar,per)=>{
		let sma_values = [];
		for (let i_array=0; i_array<per-1; i_array++ ){
			sma_values.push(ar[i_array]);
		}
		for (let i_array=per-1; i_array<ar.length-1; i_array++ ){
			let coord = [0,0];
			for (let i_per=0; i_per<per; i_per++ ){
				coord[0]+=ar[i_array-i_per][0];
				coord[1]+=ar[i_array-i_per][1];
			}
			coord[0] = coord[0]/per;
			coord[1] = coord[1]/per;
			coord[2] = ar[i_array][2];
			coord[3] = ar[i_array][3];
			coord[4] = ar[i_array][4];
			if (ar[i_array][4]==undefined)
				sma_values.push(coord);
			else
				sma_values.push(ar[i_array]);
		}
		sma_values.push(ar[ar.length-1]);
		
		return sma_values;
	}
	route['sections'].forEach((s:any) => {		
		s['smoothPaths'].forEach((sp:any,i) => {		
			s['smoothPaths'][i] = sma(sp,3);
		});
	});
  }
  decimate(route:any,desv:number){	
	let decim = (ar,perx)=>{
		let decim_values = [];
		for (let i_array=0; i_array<1; i_array++ ){
			decim_values.push(ar[i_array]);
		}
		for (let i_array=2; i_array<ar.length; i_array++ ){
			let coord = [0,0];
			let x0 = ar[i_array-2][0];
			let y0 = ar[i_array-2][1];
			let x1 = ar[i_array-1][0];
			let y1 = ar[i_array-1][1];
			let x2 = ar[i_array-0][0];
			let y2 = ar[i_array-0][1];
			let d = Math.abs((x2-x1)*(y1-y0)-(x1-x0)*(y2-y1))/Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
			//if (isNaN(d))  console.log("d is nan",ar,i_array,ar[i_array-2],ar[i_array-1],ar[i_array]);
			//console.log("d",d);
			if (d > desv){
				coord[0]=ar[i_array-1][0];
				coord[1]=ar[i_array-1][1];
				decim_values.push(coord);
			}
		}
		decim_values.push(ar[ar.length-1]);
		
		return decim_values;
	}
	route['sections'].forEach((s:any) => {		
		s['smoothPaths'].forEach((sp:any,i) => {		
			s['smoothPaths'][i] = decim(sp,3);
		});
	});
  }

  delete(id: string | number): Observable<any> {
    return this.http.delete(
      this.apiUrl + this.prefix + `/${this.apiName}/${id}`
    );
  }

  habilitar(datos: any, id: string | number): Observable<any> {
    datos['Listado de Personal'] = 'habilitar';
    return this.http.put(
      this.apiUrl + this.prefix + `/${this.apiName}/${datos.id}`,
      datos
    );
  }

  deshabilitar(datos: any, id: string | number): Observable<any> {
    datos['Listado de Personal'] = 'deshabilitar';
    return this.http.put(
      this.apiUrl + this.prefix + `/${this.apiName}/${datos.id}`,
      datos
    );
  }
}
