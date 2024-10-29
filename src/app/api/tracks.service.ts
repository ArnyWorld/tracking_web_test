import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable,tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ServicioApi } from './servicio-api';

import JSZip from 'jszip';

@Injectable({
	providedIn: 'root'
})
export class TracksService {
	apiUrl = environment.apiserver;
	apiName = 'tracks';
	prefix = '';
	constructor(private http: HttpClient) { }

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

	findByAssignment(idAssignment: string = '') {
		return this.http.get(this.apiUrl + this.prefix + `/${this.apiName}?assignment_id[equal]=${idAssignment}`)
	}
	find(id: string = '') {
		return this.http.get(this.apiUrl + this.prefix + `/${this.apiName}/${id}`)
		.pipe((tap(async (res:any)=>{
			res.content.forEach( async t=>{
				await this.processB64(t);			
			});
			return res;
		})));
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
			`/${this.apiName}?size=${size}&page=${page - 1
			}&sortBy=${sortBy}&descending=${descending}&keyword=${keyword}`
		);
	}

	delete(id: string | number): Observable<any> {
		return this.http.delete(
			this.apiUrl + this.prefix + `/${this.apiName}/${id}`
		);
	}

	async unzip(b64) {
		return new Promise((resolve, reject) => {
			const zip = JSZip();
			return zip.loadAsync(b64, { base64: true }).then(function (zipfile) {
				Object.keys(zipfile.files).forEach(async f => {
					resolve(zipfile.files[f].async("string"));
				});
			}, function (e) {
				reject("");
			});
		});
	}

	async processB64(track: any) {
		if (track['trackb64'] == "") return;
		let txt:any = await this.unzip(track.trackb64);
		let lines = txt.split("\n");		
		track['trackb64'] = lines.map(l=>{
			let sp = l.split("\t");
			return {t:Number(sp[0]),lat:Number(sp[1]),lon:Number(sp[2]),bat:Number(sp[3]),acc:Number(sp[5])}
		});
		track['coords'] = track['trackb64'].map(s=>[s.lon, s.lat]);
		
	}

}