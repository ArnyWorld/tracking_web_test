import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
	providedIn: 'root'
})
export class DevicesService {
	apiUrl = environment.apiserver;
	apiName = 'devices';
	prefix = '';
	constructor(private http: HttpClient) { }

	setPrefix(prefix: string) {
		this.prefix = prefix;
	}

	register(datos: any) {
		return this.http.post(
			this.apiUrl + this.prefix + `/${this.apiName}/sync`,
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
	registerSync(device){		
		if (device.id==null) {console.log("invalid id");  return {subscribe:(res)=>{ res={response:'invalid id'} }};}
		return this.http.post(this.apiUrl+'devices/sync',  device);
	}
	getAll(
	) {
		return this.http.get(
			this.apiUrl +
			this.prefix +
			`/${this.apiName}/listdevices`
		);
	}
	getList(
	) {
		return this.http.get(
			this.apiUrl +
			this.prefix +
			`/devices/getlist/listdevices`
		);
	}

	delete(id: string | number): Observable<any> {
		return this.http.delete(
			this.apiUrl + this.prefix + `/${this.apiName}/${id}`
		);
	}
}