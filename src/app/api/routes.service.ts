import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ServicioApi } from './servicio-api';

import { transform, fromLonLat } from 'ol/proj';
import * as olSphere from 'ol/sphere';

@Injectable({
  providedIn: 'root'
})
export class RoutesService {
	apiUrl = environment.apiserver;
	apiName = 'routes';
	prefix = '';
	constructor(private http: HttpClient) {}
  
	setPrefix(prefix: string) {
	  this.prefix = prefix;
	}
	toCoord(points:any ){		
		let coords = [];
		points.forEach((p:any) => {
			coords.push([p.lon, p.lat]);
		});
		return coords;
	}
	createPolyRouteTrack(route:any){
		let polyRouteTrack = {splitPointTracks:[]};
		route.sections.forEach(t=>{
			polyRouteTrack.splitPointTracks.push(t.splitCoords);
		})
		return polyRouteTrack;
	}
	calcAdvance(PolyRouteTrack:any,tracks:any[],polyAdvanced:any[],calcType:string, maxPointDistance){
		if (calcType == "VECTORIAL") this.calcAdvanceOne(PolyRouteTrack,tracks,polyAdvanced,maxPointDistance);
 		if (calcType == "AREA") this.calcAdvanceOmni(PolyRouteTrack,tracks,polyAdvanced,maxPointDistance);
	}
	groupBy(list, keyGetter) {
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

	pointsASections(route){		
		route['extend'] = [+180,90,-180,-90];
		route['sections'] = [];
		route['sections'] = Array.from(this.groupBy(route.points, p => p.section)).map(
			(p:any,index:number )=>{
				return {uuid:index,coords:(p[1].map( (pp:any) => { 
					route['extend'][0]=pp.lon<route['extend'][0]?pp.lon:route['extend'][0];
					route['extend'][1]=pp.lat<route['extend'][1]?pp.lat:route['extend'][1];
					route['extend'][2]=pp.lon>route['extend'][2]?pp.lon:route['extend'][2];
					route['extend'][3]=pp.lat>route['extend'][3]?pp.lat:route['extend'][3];
					;return [pp.lon,pp.lat]} ))};
			}
		);
		const extent = route.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		route['extend_3857'] = [corner1[0],corner1[1],corner2[0],corner2[1]];
		route['extend_latlon'] = route['extend'];
		console.log("extend",route['extend']);
		console.log("extend_3857",route['extend_3857']);
		console.log("extend_latlon",route['extend_latlon']);
	}

	
	processExtend(route){	
		route['extend'] = [+180,90,-180,-90];
		
		route['sections'].forEach( t => {
			t.coords.forEach( c => {
				route['extend'][0]=c[0]<route['extend'][0]?c[0]:route['extend'][0];
				route['extend'][1]=c[1]<route['extend'][1]?c[1]:route['extend'][1];
				route['extend'][2]=c[0]>route['extend'][2]?c[0]:route['extend'][2];
				route['extend'][3]=c[1]>route['extend'][3]?c[1]:route['extend'][3];
			});
		});
		const extent = route.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		route['extend_3857'] = [corner1[0],corner1[1],corner2[0],corner2[1]];
		route['extend_latlon'] = route['extend'];
		console.log("extend",route['extend']);
		console.log("extend_3857",route['extend_3857']);
		console.log("extend_latlon",route['extend_latlon']);
	}	
		
	resizeImage(base64Str):any {

		return new Promise(resolve => {
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
				resolve(canvas.toDataURL("image/jpeg"));
			}

			img.src = base64Str;
		})
	}

	calcAdvanceOmni(PolyRouteTrack:any,tracks:any[],polyAdvanced:any[],maxPointDistance){
		
		if (PolyRouteTrack == null) return;
		if (PolyRouteTrack.length == 0) return;		
		let currentPointIndex = 0;
		let dist:number = 0;
		let pointPairA = null;
		let pointPairB = null;
		PolyRouteTrack.splitPointTracks.forEach((splitPoints:any)=>{
			splitPoints.forEach(s => {
				tracks.forEach((track:any)=>{
					dist = olSphere.getDistance( [track.lon, track.lat], [s[0], s[1]] ); //spt.sphericalDistance(t.getLatLong());	
					if ( !s[2] ) {
						if (dist < maxPointDistance) {							
							s[2] = true;
						}
					}
				})
			});
		});
		/*tracks.forEach(t => {			
			for(let i = 0; i < splitPoints.length; i++ ) {
				//if (splitPoints[currentPointIndex].check) continue;
				let spt = splitPoints[i];
				dist = olSphere.getDistance( [t.lon, t.lat], [spt.lon, spt.lat] ); //spt.sphericalDistance(t.getLatLong());
				if ( !spt.check ) {
					if (dist < maxPointDistance) {
						currentPointIndex = i;
						splitPoints[currentPointIndex].check = true;
					}
				}
			}
		});*/
		let lastIndex:number = 0;
		//let polyAdvancedTemp = [];
		//polyAdvanced.splice(0, polyAdvanced.length)
		
		PolyRouteTrack.splitPointTracks.forEach((splitPoints:any)=>{
			let currentPoly = null;
			for (let i = 0; i < splitPoints.length; i++) {
				if (splitPoints[i][2] ) {				
					//drawPoly(splitPointsTrack.get(i),i);
					if (currentPoly==null) currentPoly = [];
					currentPoly.push([splitPoints[i][0], splitPoints[i][1]]);
				}else {				
					if (currentPoly == null) currentPoly=[];
					if (currentPoly.length ==0){
						const index = polyAdvanced.indexOf(currentPoly);
						polyAdvanced.splice(index,1);
						console.log("index",index);
					}
					currentPoly = [];
					polyAdvanced.push(currentPoly);
				}
				//stIndex = i;
			}
			if (currentPoly == null) currentPoly=[];
			if (currentPoly.length >0){
				polyAdvanced.push(currentPoly);
			}
			/*else {
				const index = polyAdvanced.indexOf(currentPoly);
				polyAdvanced.splice(index,1);
				console.log("index",index);
			}*/
		});
		//polyAdvanced = polyAdvancedTemp;
		//console.log("polyAdvanced",polyAdvanced);
	}
	calcAdvanceOne(splitPoints:any,tracks:any[],polyAdvanced:any[],maxPointDistance){

	}
	splitPoints(points:any ,minDist:number, maxDist:number){
		let lastPoint = null;
		let acumDist:number = 0;
		let splitPoints = [];
		points.forEach((p:any) => {
			if (lastPoint==null) {
				lastPoint = p;
				//LatLong tLatLong  = new LatLong( lastPoint.lat , lastPoint.lng );
				splitPoints.push({lat:lastPoint.lat , lon:lastPoint.lon, check:false });
				return;
			}
			let currentDist = olSphere.getDistance( [p.lon, p.lat], [lastPoint.lon, lastPoint.lat] );
			if ((currentDist) > maxDist) {
				let splitCounts:number = (currentDist-(currentDist % maxDist)) / maxDist;
				acumDist = currentDist % maxDist;
				let relDistLat:number 	= (p.lat - lastPoint.lat) / splitCounts;
				let relDistLon:number 	= (p.lon - lastPoint.lon) / splitCounts;
				for (let i = 1;i < splitCounts ; i++) {
					let tLatLong  = {lat:lastPoint.lat + relDistLat*i,lon: lastPoint.lon + relDistLon*i, check:false };			
					splitPoints.push(tLatLong);
				}				
				let tLatLong  = {lat:p.lat ,lon:p.lon, check:false  };
				splitPoints.push(tLatLong);				
				lastPoint = p;
			}else{				
				let tLatLong  = {lat:p.lat ,lon:p.lon, check:false  };
				splitPoints.push(tLatLong);
				lastPoint = p;
			}
		});
		return splitPoints;
	}
	splitPointsCoord(points:any ,minDist:number, maxDist:number){
		let lastPoint = null;
		let acumDist:number = 0;
		let splitPoints = [];
		points.forEach((p:any) => {
			if (lastPoint==null) {
				lastPoint = p;
				//LatLong tLatLong  = new LatLong( lastPoint.lat , lastPoint.lng );
				splitPoints.push([p[0],p[1],false]); //{lat:lastPoint.lat , lon:lastPoint.lon, check:false });
				return;
			}
			let currentDist = olSphere.getDistance( p, lastPoint );
			if ((currentDist) > maxDist) {
				let splitCounts:number = (currentDist-(currentDist % maxDist)) / maxDist;
				acumDist = currentDist % maxDist;
				let relDistLat:number 	= (p[1] - lastPoint[1]) / splitCounts;
				let relDistLon:number 	= (p[0] - lastPoint[0]) / splitCounts;
				for (let i = 1;i < splitCounts ; i++) {
					let tLatLong  = [lastPoint[0] + relDistLon*i,lastPoint[1] + relDistLat*i, false];			
					splitPoints.push(tLatLong);
				}				
				let tLatLong  = [p[0],p[1], false  ];
				splitPoints.push(tLatLong);				
				lastPoint = p;
			}else{				
				let tLatLong  = [p[0],p[1], false  ];
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
	  return this.http.get(this.apiUrl + this.prefix + `/${this.apiName}/${id}`);
	}
  	
	getAll(
	  size: number = 100,
	  page: number = 1,
	  sortBy: string = 'id',
	  descending: false,
	  keyword: any = ''
	) {
	  return this.http.get(
		this.apiUrl +
		  this.prefix +
		  `/${this.apiName}?size=${size}&page=${
			page - 1
		  }&sortBy=${sortBy}&descending=${descending}&keyword=${keyword}`
	  );
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