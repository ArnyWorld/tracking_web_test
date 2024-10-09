import { HttpClient, HttpHandler, HttpHeaders, HttpXhrBackend } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class RegpersonalService  {
	apiAuth = "https://regpersonal2.pragmainvest.com.bo/api/login";
	apiUrl = "https://regpersonal2.pragmainvest.com.bo/api/register";
	apiName = '';
	prefix = '';
	user = '';
	password = '';
	token = '';
	isAuth = false;
	http: HttpClient;
	_httpHandler: HttpHandler;
	header;
	
	constructor() {
        this.http = new HttpClient(new HttpXhrBackend({ 
			build: () => new XMLHttpRequest() 
		}));
	}
	isLogin(){
		return this.isAuth;
	}
	setApi(apiUrl: string) {
		this.apiUrl = apiUrl;
		
	}
	
	setCredentials(user: string, password: string) {
		this.http.post(this.apiAuth,{username:user,password:password}).subscribe(
			result => {
				this.isAuth = false;
				try{
					this.token = result['token'];
					console.log("setCredentials.result",result);
					if (this.token!=undefined){
						this.isAuth = true;
						this. header = {
							headers: new HttpHeaders()
							  .set('Authorization',  `Bearer ${this.token}`)
						  }
					}

				}
				catch(e){

				}
			}
		);
	}

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
	) {
	  return this.http.get(
		this.apiUrl,
		  this.header
	  );
	}
  
	delete(id: string | number): Observable<any> {
	  return this.http.delete(
		this.apiUrl + this.prefix + `/${this.apiName}/${id}`
	  );
	}
  }