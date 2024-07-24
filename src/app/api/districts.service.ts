import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ServicioApi } from './servicio-api';

import { transform, fromLonLat } from 'ol/proj';

@Injectable({
  providedIn: 'root'
})
export class DistrictsService  {
	apiUrl = environment.apiserver;
	apiName = 'district';
	prefix = '';
	constructor(private http: HttpClient) {}
  
	setPrefix(prefix: string) {
	  this.prefix = prefix;
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

	getExtends(route){		
		route['extend'] = [+180,90,-180,-90];
		route['coords'] = route.points.map(
			(pp:any, index:number )=>{
					route['extend'][0]=pp.lon<route['extend'][0]?pp.lon:route['extend'][0];
					route['extend'][1]=pp.lat<route['extend'][1]?pp.lat:route['extend'][1];
					route['extend'][2]=pp.lon>route['extend'][2]?pp.lon:route['extend'][2];
					route['extend'][3]=pp.lat>route['extend'][3]?pp.lat:route['extend'][3];
					;return [pp.lon,pp.lat]} 
		);
		const extent = route.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		route['extend_3857'] = [corner1[0],corner1[1],corner2[0],corner2[1]];
		route['extend_latlon'] = route['extend'];
	}
	
	processExtend(district){	
		district['extend'] = [+180,90,-180,-90];
		console.log("processExtend.district",district);
		district['coords'].forEach( c => {
				district['extend'][0]=c[0]<district['extend'][0]?c[0]:district['extend'][0];
				district['extend'][1]=c[1]<district['extend'][1]?c[1]:district['extend'][1];
				district['extend'][2]=c[0]>district['extend'][2]?c[0]:district['extend'][2];
				district['extend'][3]=c[1]>district['extend'][3]?c[1]:district['extend'][3];
			
		});
		const extent = district.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		district['extend_3857'] = [corner1[0],corner1[1],corner2[0],corner2[1]];
		district['extend_latlon'] = district['extend'];
		console.log("processSimpleExtend.extend",district['extend']);
		console.log("processSimpleExtend.extend_3857",district['extend_3857']);
		console.log("processSimpleExtend.extend_latlon",district['extend_latlon']);
	}	
  }