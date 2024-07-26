import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ServicioApi } from './servicio-api';
//import * as JSZip from "JSZip";
import * as JSZip from 'jszip';
//let zipFile: JSZip = new JSZip();

@Injectable({
  providedIn: 'root'
})
export class TracksService {
	apiUrl = environment.apiserver;
	apiName = 'tracks';
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
	async decompress (b64) {
		const ds = new DecompressionStream('gzip');
		const response = await fetch(b64);
		const blob_in = await response.blob();
		const stream_in = blob_in.stream().pipeThrough(ds);
		const blob_out = await new Response(stream_in).blob();
		return await blob_out.text();
	};
	  
	async unzip(b64){
		//let zipFile: JSZip = new JSZip();
		/*const zip = await JSZip();
		
		const isxlsxFile = (name: any)=> name.toLowerCase().endsWith(".xlsx");
			zip.loadAsync("", {base64: true}).then(function (zipfile) {
				console.log("zipfile",zipfile);
			}, function (e) {

			});*/

	}

	async getCoords(track:any){
		console.log("b64",track.trackb64);
		//let txt = await this.decompress(track.trackb64 ).then((result) => {  console.log(result); });
		let txt = await this.unzip(track.trackb64);
		console.log("txt",await txt);
		return txt;
	}

  }