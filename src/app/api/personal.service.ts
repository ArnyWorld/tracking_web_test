import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ServicioApi } from './servicio-api';


@Injectable({
  providedIn: 'root'
})
export class PersonalService {
	apiUrl = environment.apiserver;
	apiName = 'personal';
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
			`/${this.apiName}`
			//`/${this.apiName}?[personal_type_id][equal]=14`
		);
	  }
	
	  getAll2(
	  ) {
		return this.http.get(
		  this.apiUrl +
			this.prefix +
			`/${this.apiName}/fortable`
			//`/${this.apiName}?[personal_type_id][equal]=14`
		);
	  }
	
	getSync(
	) {
	  return this.http.get(
		this.apiUrl +
		  this.prefix +
		  `/${this.apiName}/syncfull`
		  //`/${this.apiName}?[personal_type_id][equal]=14`
	  );
	}
  	
	getAllMorning(
	  ) {
		return this.http.get(
		  this.apiUrl +
			this.prefix +
			`/${this.apiName}?[schedule_id][equal]=1`
			//`/${this.apiName}?[personal_type_id][equal]=14`
		);
	  }

	delete(id: string | number): Observable<any> {
	  return this.http.delete(
		this.apiUrl + this.prefix + `/${this.apiName}/${id}`
	  );
	}
  
	habilitar(datos: any, id: string | number): Observable<any> {
	  datos['deleted'] = true;
	  return this.http.put(
		this.apiUrl + this.prefix + `/${this.apiName}/${datos.id}`,
		datos
	  );
	}
  
	deshabilitar(datos: any, id: string | number): Observable<any> {
		datos['deleted'] = false;
	  return this.http.put(
		this.apiUrl + this.prefix + `/${this.apiName}/${datos.id}`,
		datos
	  );
	}
  }