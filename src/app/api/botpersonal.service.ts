import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

enum BOT_STATES {
	SELECT_PERSONAL,
	SELECT_DEVICE,
	LEAVE_DEVICE,
	SELECTION_ASSIGNMENT,	
	TRAKING_CAPTURE,
	ON_SESSION,
	SEND_SESSION,
	SEND_ENDSESSION,
	IDDLE,
}
enum BOT_DEV_STATES {
	SELECT_ASSIGNMENT,
	ACCEPT_ROUTE,
	TRACKING,
	IDDLE,
	SEND_SUGGESTION,
	SEND_EMERGENCY,
	SEND_CLAIM,
	TAKING_PHOTO,
}
@Injectable({
	providedIn: 'root'
})

export class Botpersonal {	
	BOT_STATES: typeof BOT_STATES = BOT_STATES;
	BOT_DEV_STATES: typeof BOT_DEV_STATES = BOT_DEV_STATES;

	
	states_cooldown ={};
	states_dev_cooldown ={};

	apiUrl = environment.apiserver;
	wsTrack = environment.wsserver;
	config= {
		late_margin_min:15,
		min_duration_ratio : 1200,//600 ok
	}
	states= {
		late_margin_next:-1
	}
	apiName = 'devices';
	prefix = '';
	constructor(private http: HttpClient) {
		this.setupCooldown();
		this.devicehw = new this.DeviceHW();
	}
	DeviceHW = function () {
		this.lat = 0;
		this.lon = 0;
		this.getLat = () => this.lat;
		this.getLon = () => this.lon;
		this.setLatLon = (lat,lon)=>{
			this.lat = lat;
			this.lon = lon;
		}
		this.marker = {
			id: '0',
			img: 'assets/ic_device/ic_device_l0_e0_c0_b0.svg'
		}
		this.rndLatLonRoute = (route:any,rad=10) =>{
			console.log("route",route);
			/*this.lat = route.points[0].lat + Math.random()/10000000;
			this.lon = route.points[0].lon + Math.random()/10000000;*/
			this.lat = route.points[0].lat ;
			this.lon = route.points[0].lon ;
			console.log("lat",this.lat, " lon:",this.lon);
		}
	}
	devicehw : any;
	device :any;
	setupCooldown(){
		this.states_cooldown[BOT_STATES.IDDLE] = {
				time : 120000,
				last : 0,				
			};			
		this.states_cooldown[BOT_STATES.SELECTION_ASSIGNMENT] = {
				time : 120000,
				last : 0,
			};
		this.states_cooldown[BOT_STATES.ON_SESSION] = {
			time : 120000,
			last : 0,
		};
		this.states_cooldown[BOT_STATES.SEND_SESSION] = {
			time : 600000,
			last : 0,
		};
		this.states_cooldown[BOT_STATES.SEND_ENDSESSION] = {
			time : 600000,
			last : 0,
		};
		this.states_dev_cooldown[BOT_DEV_STATES.IDDLE] = {
			time : 60000,
			last : 0,
		};
		this.states_dev_cooldown[BOT_DEV_STATES.TRACKING] = {
			time : 5000,
			last : 0,
		};
	}
	days = {0:'dom',1:'lun',2:'mar',3:'mie',4:'jue',5:'vie',6:'sab'};
	

	monitor:any
	handled:any
	cPersonal:any;
	cAssignment:any;
	cSession:any;
	cFrequency:any;
	cRoute:any;
	fromDateLive:any;
	toDateLive:any;	
	intervalTime:number;
	//minDurationRatio = 600; // 600 best

	devices:any;
	routes:any;
	currentState = BOT_STATES.IDDLE;
	currentDeviceState = BOT_DEV_STATES.IDDLE;
	
	cDevice:any;
	
	setTime(fromDateLive:any,toDateLive:any,intervalTime:number){
		this.fromDateLive = fromDateLive;
		this.toDateLive = toDateLive;
		this.intervalTime = intervalTime;
	}
	setData(personal:any,devices:any,routes:any){
		//this.personal = personal[0];
		this.cPersonal = personal;
		this.devices = devices;
		this.routes = routes;
		//console.log("bot.config.devices ", this.devices);
		console.log("bot.config.cPersonal ", this.cPersonal);
		this.monitor.personal = this.cPersonal;
	}
	setMonitor(monitor:any){
		this.monitor = monitor;
	}
	
	start(){
		//let fromDate = Date.parse("2024-03-07 07:05:03.000");
		//let fromDate = Date.parse("2024-03-07 07:05:03.000+00:00");
		let now_date_stamp = Date.parse(this.fromDateLive);
		console.log("now_date_stamp", now_date_stamp);
		let lasttime = Date.now();
		console.log("states_cooldown",this.states_cooldown);
		this.handled = setInterval(()=>{			
			let time = Date.now();
			let elapsed = (time-lasttime);
			lasttime = time;
			//console.log(time);
			//console.log(new Date(time).toISOString());
			now_date_stamp += elapsed*this.config.min_duration_ratio;
			//console.log(fromDate);
			let str_date:any=new Date(now_date_stamp);
		//	console.log(strDate.toISOString(),"day:"+strDate.getDay());
			this.monitor['time']=str_date.toLocaleString()+" "+ this.days[str_date.getDay()] ;

			this.update(elapsed,now_date_stamp,str_date);
			this.updateDevice(elapsed,now_date_stamp,str_date);
			},this.intervalTime)
	}
	
	updateDevice(delta:number,now_date_stamp,str_date){

		this.monitor.stateDevice = this.currentDeviceState;
		switch(this.currentDeviceState){
			case BOT_DEV_STATES.TRACKING:
				if ((now_date_stamp - this.states_cooldown[this.currentState].last) > this.states_cooldown[this.currentState].time) {
					this.state_selection_assignment(delta,now_date_stamp,str_date);
					this.states_cooldown[this.currentState].last = now_date_stamp;				
				}
				break;

			default:
		}
	}
	update(delta:number,now_date_stamp,str_date){
		this.monitor.state = this.currentState;
		switch(this.currentState){
			case BOT_STATES.IDDLE:
				//console.log("this.states_cooldown[BOT_STATES.IDDLE].last",this.states_cooldown[BOT_STATES.IDDLE].last);
				if ((now_date_stamp - this.states_cooldown[BOT_STATES.IDDLE].last) > this.states_cooldown[BOT_STATES.IDDLE].time) {
					this.stateIddle(delta,now_date_stamp,str_date);
					this.states_cooldown[BOT_STATES.IDDLE].last = now_date_stamp;				
				}
				break;
			case BOT_STATES.SELECTION_ASSIGNMENT:
				if ((now_date_stamp - this.states_cooldown[this.currentState].last) > this.states_cooldown[this.currentState].time) {
					this.state_selection_assignment(delta,now_date_stamp,str_date);
					this.states_cooldown[this.currentState].last = now_date_stamp;				
				}
				break;
			case BOT_STATES.ON_SESSION:
				if ((now_date_stamp - this.states_cooldown[this.currentState].last) > this.states_cooldown[this.currentState].time) {
					this.onSession(delta,now_date_stamp,str_date);
					this.states_cooldown[this.currentState].last = now_date_stamp;				
				}
				break;
			case BOT_STATES.SEND_SESSION:
				if ((now_date_stamp - this.states_cooldown[this.currentState].last) > this.states_cooldown[this.currentState].time) {
					this.saveSession(delta,now_date_stamp,str_date);
					this.states_cooldown[this.currentState].last = now_date_stamp;	
				}
				break;
			case BOT_STATES.SEND_ENDSESSION:
				if ((now_date_stamp - this.states_cooldown[this.currentState].last) > this.states_cooldown[this.currentState].time) {
					this.endSession(delta, now_date_stamp, str_date);
					this.states_cooldown[this.currentState].last = now_date_stamp;				
				}
				break;
			default:
		}
	}
	state_selection_assignment(delta:number, date_now,str_date){

		console.log("state_selection_assignment");
	}
	stateIddle(delta:number, date_now,str_date){
		if (this.states.late_margin_next == -1){
			this.states.late_margin_next = ((this.config.late_margin_min*2) * Math.random() - this.config.late_margin_min)|0;
			console.log("this.states.late_margin_next",this.states.late_margin_next);
		}
		//this.is_session_time(time);
		let weekday = str_date.getDay();
		let hour = (str_date.getHours()+"").padStart(2,'0');
		let min = (str_date.getMinutes()+"").padStart(2,'0');
		let hour_militar = parseInt(hour+min) ;
		let frequency = this.cPersonal.schedule.frequency.find(f=>f.weekday == weekday);
		if (frequency == null) {
			//console.log("frecuency not found");
			return;
		}
		//console.log("frequency",frequency);
		let freq_start = parseInt(frequency.start_time.replace(":",""));
		let freq_end = parseInt(frequency.end_time.replace(":",""));
		
		//console.log(hour_militar,freq_start,freq_end);
		if (hour_militar > freq_start+this.states.late_margin_next && hour_militar < freq_start+100){
			
			if (this.cSession != null ) {console.log("a session is started"); return;}
			console.log("valid frequency");
			console.log(hour_militar,freq_start,freq_end);
			this.states.late_margin_next = -1;
			this.cFrequency = frequency;
			this.pickDevice();
			this.configSession(delta, date_now, str_date);			
		}		

	}
	onSession(delta:number, date_now,str_date){
		if (this.states.late_margin_next == -1){
			this.states.late_margin_next = ((this.config.late_margin_min*2) * Math.random() - this.config.late_margin_min)|0;
			console.log("this.states.late_margin_next",this.states.late_margin_next);
		}
		//this.is_session_time(time);
		let weekday = str_date.getDay();
		let hour = (str_date.getHours()+"").padStart(2,'0');
		let min = (str_date.getMinutes()+"").padStart(2,'0');
		let hour_militar = parseInt(hour+min) ;
	
		//console.log("frequency",frequency);
		let freq_start = parseInt(this.cFrequency.start_time.replace(":",""));
		let freq_end = parseInt(this.cFrequency.end_time.replace(":",""));
		
		if (hour_militar > freq_end+this.states.late_margin_next  ){
			console.log("valid frequency to end");				
			this.currentState = BOT_STATES.SEND_ENDSESSION;
		}		

	}
	pickDevice(){
		this.cDevice = this.devices.find((d:any) => d['used']==false);
		if (this.cDevice == null ) {console.log("no find device"); return;}
		//console.log("cDevice",this.cDevice);
		this.cDevice['used'] = true;
		this.monitor.device = this.cDevice;
		this.monitor.devicehw = this.devicehw;
		console.log("device picked", this.cDevice);
	}
	endSession(delta:number, date_now, str_date){
		if (this.cSession == null ) {console.log("no have session"); return;}
		this.cSession['logout_date'] = date_now;
		this.cSession['end_lat'] = this.devicehw.getLat();
		this.cSession['end_lon'] = this.devicehw.getLon();
		
		this.http.put(this.apiUrl+"/session/"+this.cSession.id, this.cSession ).subscribe(
			(result:any)=>{
				console.log(`endSession: PUT this.apiUrl+"/session" `,result );
				this.cSession = null;
				this.cRoute = null;				
				this.cDevice.used = false;
				this.cDevice = null;
				this.monitor.device = null;
				this.monitor.route = null;
				this.currentState = BOT_STATES.IDDLE;
			}
		);
	}
	configSession(delta:number, date_now, str_date){
		let weekday = str_date.getDay();
		if (this.cDevice == null ) {console.log("no have device"); return;}
		let route = null;
		this.cAssignment = this.cPersonal.assignments.find((a:any) => { 
			let route = this.routes.find( r => r.id == a.route_id );
			if ( route.frequency.includes(weekday)) {
				a['route'] = route;
				return true;}
			return false;
		});

		if (this.cAssignment == null){ console.log("no assignments"); return; }
		this.cRoute = this.cAssignment.route;
		this.devicehw.rndLatLonRoute(this.cRoute,10);
		console.log("current route",this.cRoute);
		this.monitor.route = this.cRoute;
		//this.monitor.deviceHW = this.deviceHW;
					
		this.currentState = BOT_STATES.SEND_SESSION;
		
	}
	saveSession(delta:number, date_now, str_date){
		
		let data = {
			"personal_id": this.cPersonal.id,
            "device_id": this.cDevice.id,
            "login_date": date_now,
            "logout_date": null,
            "start_lat": this.devicehw.getLat(),
            "start_lon": this.devicehw.getLon(),
            "end_lat": 0,
            "end_lon": 0,
		}
		console.log("saving on ",new Date(date_now).toLocaleString() );
		this.http.post(this.apiUrl+"/session", data ).subscribe(
			(result:any)=>{
				console.log(`startSession: this.apiUrl+"/session" `,result );
				this.cSession = result.content;
				this.currentState = BOT_STATES.ON_SESSION;
				this.currentDeviceState = BOT_DEV_STATES.TRACKING;
				
			},(err:any)=>{

			}
		);
	}
	stop(){
		clearInterval(this.handled);
	}
}
