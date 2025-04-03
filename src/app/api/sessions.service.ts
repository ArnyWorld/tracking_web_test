import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
	providedIn: 'root'
})
//TREBOL-15 Para verificación servicio de control de sesiones
export class SessionsService {
	apiUrl = environment.apiserver;
	apiName = 'session';
	prefix = '';
	constructor(private http: HttpClient) { }

	setPrefix(prefix: string) {
		this.prefix = prefix;
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

	historyDevice(id: string = '') {
		return this.http.get(this.apiUrl + this.prefix + `/${this.apiName}?device_id[equal]=${id}`);
	}

	historyPersonal(id: string = '') {
		return this.http.get(this.apiUrl + this.prefix + `/${this.apiName}?personal_id[equal]=${id}`);
	}

	getAll(
	) {
		return this.http.get(
			this.apiUrl +
			this.prefix +
			`/${this.apiName}`
		);
	}
	delete(id: string | number): Observable<any> {
		return this.http.delete(
			this.apiUrl + this.prefix + `/${this.apiName}/${id}`
		);
	}
}