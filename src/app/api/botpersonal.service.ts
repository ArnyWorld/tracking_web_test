import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
	providedIn: 'root'
})
export class Botpersonal {
	apiUrl = environment.apiserver;
	wsTrack = environment.wsserver;
	apiName = 'devices';
	prefix = '';
	constructor(private http: HttpClient) { }

	handled:any
	start(){
		//let fromDate = Date.parse("2024-03-07 07:05:03.000");
		let fromDate = Date.parse("2024-03-07 07:05:03.000+00:00");
		console.log("fromDate", fromDate);
		let lasttime = Date.now();
		this.handled = setInterval(()=>{
			
			let time = Date.now();
			let elapsed = (time-lasttime);
			lasttime = time;
			//console.log(time);
			//console.log(new Date(time).toISOString());
			fromDate += elapsed;
			//console.log(fromDate);
			console.log(new Date(fromDate).toISOString());
			},1000
		)
	}
	stop(){
		clearInterval(this.handled);
	}
}