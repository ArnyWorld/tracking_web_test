import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RoutesService } from './routes.service';
import * as olSphere from 'ol/sphere';
import JSZip from 'jszip';
import { transform, fromLonLat } from 'ol/proj';

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

export class Botpersonallive {	
	BOT_STATES: typeof BOT_STATES = BOT_STATES;
	BOT_DEV_STATES: typeof BOT_DEV_STATES = BOT_DEV_STATES;

	
	states_cooldown ={};
	states_dev_cooldown ={};

	apiUrl = environment.apiserver;
	wsserver = environment.wsserver;
	config= {
		late_margin_min:1,	//15
		min_duration_ratio : 250//4800,//600 ok
	}
	states= {
		late_margin_next:-1
	}
	apiName = 'devices';
	prefix = '';
	view = null;
	
	constructor(private http: HttpClient, routesService: RoutesService) {
		this.setupCooldown();
		this.devicehw = new this.DeviceHW(this, this.http);
		
		console.log("routesService",routesService);
		this.devicehw.setService(routesService);
	}
	DeviceHW = function ( app:any, http:HttpClient) {
		this.http = http;
		this.cDevice = null;
		this.app = app;
		this.lat = 0;
		this.lon = 0;
		this.steps = 0;
		this.getLat = () => this.lat;
		this.getLon = () => this.lon;
		this.state = 0; //0:no target 1:target 2:ended
		this.route = null;
		this.target = {lat:0,lon:0,rlat:0,rlon:0,index:0,sc:null,route:null,checkpoints:null,completed:0,completedRound:0},
		this.routeService;
		this.map = {};
		this.battery = 100;
		this.batteryRound = 100;
		this.batconsume = 1+Math.random()*0.5;
		this.tracks = [];
		this.configFile = {};		
		this.setService = (routesService:RoutesService)=>{
			this.routesService = routesService;
			//console.log(routesService);
		};
		this.setTarget = (lat,lon)=>{			
			this.target.lat = lat;
			this.target.lon = lon;
			this.target.index = 0;
		};
		this.targetIncreaseT = ()=>{
			this.target.index++;
			let rndLat = Math.random()/5000 - 1/10000;
			let rndLon = Math.random()/5000 - 1/10000;
			this.target.lat = this.route.points[this.target.index].lat ;
			this.target.lon = this.route.points[this.target.index].lon ;
			this.target.rlat = this.route.points[this.target.index].lat + rndLat;
			this.target.rlon = this.route.points[this.target.index].lon + rndLon;
		};
		this.targetIncreaseSingle = ()=>{
			this.target.index++;
			let rndLat = Math.random()/5000 - 1/10000;
			let rndLon = Math.random()/5000 - 1/10000;
			let dist_min = 99999999;
			for (let i = 0; i < this.route.points.length; i++){
				if (this.route.points[i]['check'] == true) continue;
				let d = olSphere.getDistance([this.lon,this.lat],[this.route.points[i].lon, this.route.points[i].lat]);
				if (d < dist_min ){
					this.target.index = i;
					dist_min = d;
				}
			}
			this.target.lat = this.route.points[this.target.index].lat ;
			this.target.lon = this.route.points[this.target.index].lon ;
			this.target.rlat = this.route.points[this.target.index].lat + rndLat;
			this.target.rlon = this.route.points[this.target.index].lon + rndLon;
		};
		this.targetIncrease = ()=>{	//sections
			this.target.index++;
			let rndLat = Math.random()/5000 - 1/10000;
			let rndLon = Math.random()/5000 - 1/10000;
			let dist_min = 99999999;
			let tot = 0;
			let nocheck = 0;
			//console.log("this.target",this.target)
			//if (this.target.checkpoints == null) return;
			for (let i = 0; i<this.route.sections.length; i++ ){
				for (let j = 0; j<this.route.sections[i].splitCoords.length; j++ ){
					tot++;
					let sc = this.route.sections[i].splitCoords[j];
					if (sc[2] == true) continue;
					nocheck++;
					let d = olSphere.getDistance([this.lon,this.lat],[sc[0], sc[1]]);
					if (d < dist_min ){
						this.target.sc = sc;
						this.target.index_section = i;
						this.target.index = j;
						this.target.lat = sc[1] ;
						this.target.lon = sc[0] ;
						this.target.rlat = this.target.lat + rndLat;
						this.target.rlon = this.target.lon + rndLon;
						//console.log("dist_min",dist_min);
						dist_min = d;
					}				
				}				
			}
			this.target.completed = Math.round((tot-nocheck)/tot*100)/1;
			this.target.completedRound = Math.round(this.target.completed);
			if(dist_min == 99999999){				
				this.app.currentState = BOT_STATES.SEND_ENDSESSION;
			}

		};
		this.endPoint = ()=>{
			//this.route.points[this.target.index]['check'] = true;
			//this.route.sections[this.target.index_section].splitCoords[this.target.index][2] = true;
			this.target.sc[2] = true;
		};
		this.setLatLon = (lat,lon)=>{
			this.lat = lat;
			this.lon = lon;
		};
		this.setConfigFile = (cDevice,cRoute,cPersonal,cAssignment,cSession,delta, date_now, str_date) => {
			this.cDevice = cDevice;
			this.configFile = {
				config:{
					"SERVER_API": environment.apiserver,
					"SERVER_TRACK": environment.wsserver,
					"LIVE_CAPTURE": "1",
					"SERVICE_TICK": "5",
					"TRACK_CAPTURE": "3",
					"SAVE_OFFLINE": "10",
					"INTERNET_TEST": "60",
					"UPDATE_STATUS": "30",
					"PARAM_UPDATE": "60",
					"SAVE_ONLINE": "60",
					"MAX_POINT_DIST": "10",
					"SESSION_MAX_TIME": "36000",
					"END_ROUTE_FORGOTTEN": "14400",
					"PHOTO_MIN": "3",
					"PHOTO_MAX": "7",
					"INFO_FINGERPRINT": "",
					"INFO_SERIAL": "",
					"INFO_MODEL": cDevice.info_model,
					"INFO_DEVICE":cDevice.info_device,
					"INFO_BRAND": cDevice.info_brand,
					"INFO_PRODUCT": cDevice.info_product,
					"INFO_MANUFACTURER": cDevice.info_manufacturer,
				},
				states : {
					
					"IS_SERVICE": "1",
					"ID_SERVICE": "d1af0d8c",
					"ID_LOCATION": "d1af0d8c",
					"ID_USER": cPersonal.id,
					"ID_ROUTE": cRoute.id,
					"ID_SESSION": cSession.id,
					"ID_ASSIGNMENT": cAssignment.id,
					"TRACK_INI": date_now,
					"ON_ROUTE": "1",
					"ACTIVITY": "ActivityRouteTracking",
					"LAST_UPDATE_DB": "1723065597033",
					"IS_SESSION": "1",
					"SESSION_START": date_now,
					"IS_LIVE": "0",
					"IS_PAUSE": "0",
					"PAUSE_INI": "0",
					"IS_TRACK": "1",
					"IS_EMERGENCY": "0",
					"IS_INTERNET": "0",
					"REQ_LIVE": "0",
					"REQ_UPDATE": "0",
					"REQ_TRACK": "0",
					"NOTIF_REQ": "0",
					"NOTIF_TITLE": "",
					"NOTIF_DESC": ""
					}
			};
			this.http.post(environment.wsserver + `/device/${cDevice.id}/update/config`,this.configFile.config ).subscribe(
				result=>{
					console.log("trackPost.update/config.result",result);
				}
			);
			this.http.post(environment.wsserver + `/device/${cDevice.id}/update/state`,this.configFile.states ).subscribe(
				result=>{
					console.log("trackPost.result",result);
				}
			);
			console.log("devicehw: setConfigFile.configFile",this.configFile);
		};
		this.marker = {
			id: '0',
			img: 'assets/ic_device/ic_device_l0_e0_c0_b0.svg',
		};
		this.tick = (delta:number,now_date_stamp,str_date)=>{
			if (this.state==2) return;
			//console.log("tick delta:",delta);
			this.battery -= this.batconsume*(delta/1000)+Math.random()*this.batconsume*(delta/2000);
			this.batteryRound = Math.round(this.battery);

			let dir_lat = (this.target.rlat - this.lat);
			let dir_lon = (this.target.rlon - this.lon);			
			let dist = olSphere.getDistance([this.lon,this.lat],[this.target.rlon, this.target.rlat]);
			//console.log("dist:",dist);
			let dir_lat_nor = dir_lat/dist;
			let dir_lon_nor = dir_lon/dist;
			//console.log("dir_lat_nor:",dir_lat_nor);
			//console.log("dir_lon_nor:",dir_lon_nor);
			let distStep  = olSphere.getDistance([this.lon,this.lat],[this.lon+dir_lon_nor, this.lat+dir_lat_nor])*delta/10;
			this.steps = distStep;
			this.lat += dir_lat_nor*(delta/10) + Math.random()*dir_lat_nor*(delta/10)*0.2;
			this.lon += dir_lon_nor*(delta/10) + Math.random()*dir_lat_nor*(delta/10)*0.2;
			//console.log("distStep",distStep);

			if (dist<5*3){
				this.endPoint();
				this.targetIncrease();
			}
		}
		this.rndLatLonRoute = (route:any,rad=10) =>{
			console.log("route",route);
			this.route = route;
			
			
			//for(let i = 0; i < 200;i++){								
				let rndLat = Math.random()/5000 - 1/10000;//let rndLat = Math.random()/5000 - 1/10000;
				let rndLon = Math.random()/5000 - 1/10000;//let rndLon = Math.random()/5000 - 1/10000;
				this.lat = this.route.points[0].lat + rndLat;
				this.lon = this.route.points[0].lon + rndLon;				
				let dist = olSphere.getDistance([this.lon,this.lat],[route.points[0].lon, route.points[0].lat]);
				
			this.target.index = -1;
			this.targetIncrease();
				console.log("dist" , dist);
			//}
			
		};
		this.recTrack = (delta:number,now_date_stamp,str_date)=>{
			let new_track = {
				t:now_date_stamp,
				lat:this.lat,
				lon:this.lon,
				bat:Math.round(this.battery*100)/100,
				acc:1
			};
			this.tracks.push(new_track);		
			let data = `{"device":"${this.cDevice.id}","t":${new_track.t},"lat":${new_track.lat},"lon":${new_track.lon},"b":${Math.round(this.battery)},"acc":${new_track.acc}}`
			this.http.get(environment.wsserver + `/data?msg=${data}` ).subscribe();	
		}
		this.getTrackb64 = async (callback)=>{
			
			const zip = JSZip();

			this.trackstxt = [];
			for( let i = 0; i < this.tracks.length ; i++)
				this.trackstxt.push(`${this.tracks[i].t}\t${this.tracks[i].lat}\t${this.tracks[i].lon}\t${this.tracks[i].bat}\t1\t${this.tracks[i].acc}`);

			zip.file("tracking.txt", this.trackstxt.join('\n'));

		/*	return zip.loadAsync(b64, { base64: true }).then(function (zipfile) {
				Object.keys(zipfile.files).forEach(async f => {
					resolve(zipfile.files[f].async("string"));
				});
			}, function (e) {
				reject("");
			});
*/
			zip.generateAsync({type:"blob"}).then(async function(content) {
				// see FileSaver.js
				//saveAs(content, "example.zip");
				//let filezip = await this.blobToBase64(content);
				var reader:any = new FileReader();
				reader.readAsDataURL(content); 
				reader.onloadend = function() {
				var base64data = reader.result.replace("data:application/zip;base64,","");                
				//console.log("b64",base64data.replace("data:application/zip;base64,",""));
				//console.log("b64",base64data);
				if (callback!=null) callback(base64data);
				}
			});
		}
		/*function blobToBase64(blob) {
			return new Promise((resolve, _) => {
			  const reader = new FileReader();
			  reader.onloadend = () => resolve(reader.result);
			  reader.readAsDataURL(blob);
			});
		  }*/
		this.setRoute = (route) => {
			this.route = route;
			this.tracks = [];
			
			this.battery = 100;
			this.batteryRound = 100;
			this.target = {lat:0,lon:0,rlat:0,rlon:0,index:0,sc:null,route:null,checkpoints:null,completed:0,completedRound:0};

			console.log("this.route",this.route);
			let splitPointsCoordsCheck = [];
			let tracksPolyline = [];
			let tracks = [];
			/*let PolyRouteTrack = this.routesService.createPolyRouteTrack(this.route);
			this.routesService.calcAdvance(PolyRouteTrack ,tracks,tracksPolyline,"AREA",10);				
			splitPointsCoordsCheck = PolyRouteTrack.splitPointTracks.map( t => t.filter(s=> s[2]));*/
			//route.sections.forEach(s=>s.splitCoords.forEach(sc=>sc[2]=false));
			
			//this.target.checkpoints = this.route.sections;
			console.log("this.route",this.route);
			//console.log("this.target.checkpoints",this.target.checkpoints);
			//device['splitPointsCoordsCheck'] = device['PolyRouteTrack'].splitPointTracks.map( t => t.filter(s=> s[2]));

			//this.checkPoints = this.routesService.splitPointsCoord( this.route.points, 4, 10 );
			//console.log("PolyRouteTrack", PolyRouteTrack);
			//console.log("splitPointsCoordsCheck", splitPointsCoordsCheck);
		};
		this.findTarget = (route) => {

		};
	}
	devicehw : any;
	device :any;
	factorRate = 2
	setupCooldown(){
		this.states_cooldown[BOT_STATES.IDDLE] = {
				time : 60000*this.factorRate,
				last : 0,				
			};			
		this.states_cooldown[BOT_STATES.SELECTION_ASSIGNMENT] = {
				time : 60000*this.factorRate,
				last : 0,
			};
		this.states_cooldown[BOT_STATES.ON_SESSION] = {
			time : 120000,
			last : 0,
		};
		this.states_cooldown[BOT_STATES.SEND_SESSION] = {
			time : 600000*this.factorRate,
			last : 0,
		};
		this.states_cooldown[BOT_STATES.SEND_ENDSESSION] = {
			time : 600000*this.factorRate,
			last : 0,
		};
		this.states_dev_cooldown[BOT_DEV_STATES.IDDLE] = {
			time : 60000*this.factorRate,
			last : 0,
		};
		this.states_dev_cooldown[BOT_DEV_STATES.TRACKING] = {
			time : 5000,
			last : 0,
			rnd : 2000,
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
	
	addView (view:any){
		this.view = view;
	};
	thread:any;
	start(){
		//let fromDate = Date.parse("2024-03-07 07:05:03.000");
		//let fromDate = Date.parse("2024-03-07 07:05:03.000+00:00");
		let now_date_stamp = Date.parse(this.fromDateLive);
		console.log("now_date_stamp", now_date_stamp);
		let lasttime = Date.now();
		console.log("states_cooldown",this.states_cooldown);
		
		this.thread = ()=>{			
		//this.handled = setInterval(()=>{			
			let time = Date.now();			
			let elapsed = (time-lasttime);			
			lasttime = time;

			//console.log(time);
			//console.log(new Date(time).toISOString());
			now_date_stamp += elapsed*this.config.min_duration_ratio;

			if (time < now_date_stamp )	this.config.min_duration_ratio = 1;

			//console.log(fromDate);
			let str_date:any=new Date(now_date_stamp);
		//	console.log(strDate.toISOString(),"day:"+strDate.getDay());
			this.monitor['time']=str_date.toLocaleString()+" "+ this.days[str_date.getDay()] ;

			this.update(elapsed,now_date_stamp,str_date);
			this.updateDevice(this.config.min_duration_ratio*elapsed,now_date_stamp,str_date);
		};
		//	},this.intervalTime)
	}
	
	updateDevice(delta:number,now_date_stamp,str_date){
//console.log("delta---",delta);
		this.monitor.stateDevice = this.currentDeviceState;
		switch(this.currentDeviceState){
			case BOT_DEV_STATES.TRACKING:
				this.tracking(delta,now_date_stamp,str_date);
				if ((now_date_stamp - this.states_dev_cooldown[this.currentDeviceState].last) >= this.states_dev_cooldown[this.currentDeviceState].time) {					
					this.devicehw.recTrack(delta,now_date_stamp,str_date);
					this.states_dev_cooldown[this.currentDeviceState].last = now_date_stamp;									
					//if (this.view != null) this.view.setCenter([this.devicehw.lon, this.devicehw.lat]);
					if (this.view != null) this.view.setCenter(transform([this.devicehw.lon, this.devicehw.lat], 'EPSG:4326', 'EPSG:3857'));					
				}
				
				break;

			default:
		}
	}
	tracking(delta:number, now_date_stamp, str_date){		
		//this.devicehw.tick((delta/1000) * (this.config.min_duration_ratio ,now_date_stamp/10), str_date);
		//console.log("delta:",delta);
		//console.log("sl:",(now_date_stamp - this.states_dev_cooldown[this.currentDeviceState].last) /1000);
		//this.devicehw.tick((this.states_dev_cooldown[this.currentDeviceState].time / (100*((this.config.min_duration_ratio*60)/6)) )*(this.config.min_duration_ratio), now_date_stamp, str_date);
		//this.devicehw.tick( ((now_date_stamp - this.states_dev_cooldown[this.currentDeviceState].last) /1000 )/(this.config.min_duration_ratio), now_date_stamp, str_date);
		this.devicehw.tick(this.config.min_duration_ratio /100, now_date_stamp, str_date);
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
	addTime(t,a){		
		let sum_t = t%100;
		let sum_r = t-sum_t;
		let r_add = sum_t + a;
		if ( r_add <0)	
			return t - (40-r_add);
		else		
			return sum_r+r_add;
	}
	stateIddle(delta:number, date_now,str_date){
		if (this.states.late_margin_next == -1){
			this.states.late_margin_next = Math.trunc((this.config.late_margin_min*2) * Math.random() - this.config.late_margin_min);			
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
		
		//console.log("frequency",frequency);
		//console.log("hour_militar",hour_militar,  this.addTime(freq_start, this.states.late_margin_next));
		if ((hour_militar > this.addTime(freq_start, this.states.late_margin_next)) && hour_militar < freq_start+100){
			
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
		//this.cSession['start_lat'] = this.devicehw.getLat();
		//this.cSession['start_lon'] = this.devicehw.getLon();
		this.cSession['end_lat'] = this.devicehw.getLat();
		this.cSession['end_lon'] = this.devicehw.getLon();
		
		this.http.put(this.apiUrl+"/session/"+this.cSession.id, this.cSession ).subscribe(
			async (result:any)=>{
				console.log(`endSession: PUT this.apiUrl+"/session" `,result );
				
				//console.log("tracks",this.devicehw.tracks);
				//console.log("tracks.b64", await this.devicehw.getTrackb64());
				let trackPost = {
					"assignment_id": this.cAssignment.id,
					"session_id": this.cSession.id,
					"route_id": this.cRoute.id,
					"start_date": this.cSession.login_date,
					"end_date": date_now,
					"abandoned": this.devicehw.target.completed>95?false:true,
					"comments": "",
					"complete": this.devicehw.target.completed,
					"routeb64": null,
					"trackb64":''
				};
				this.devicehw.getTrackb64((b64)=>{
					trackPost.trackb64 = b64;
					// 	console.log("trackPost.tosend",trackPost);
					this.http.post(this.apiUrl+"/tracks",trackPost).subscribe( result=>{ console.log("trackPost.result",result);			}
					);
				});
				this.cSession = null;
				this.cRoute = null;				
				this.cDevice.used = false;
				this.cDevice = null;
				this.monitor.device = null;
				this.monitor.route = null;
				this.monitor.devicehw = null;
				this.currentState = BOT_STATES.IDDLE;
				this.currentDeviceState = BOT_DEV_STATES.IDDLE;
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
		for (let i = 0;i<this.cRoute.sections.length;i++)
			for (let j = 0;j<this.cRoute.sections[i].splitCoords.length;j++)
				this.cRoute.sections[i].splitCoords[j][2]=false;
		console.log("current route",this.cRoute);
		this.monitor.route = this.cRoute;
					
		this.currentState = BOT_STATES.SEND_SESSION;
		
	}
	saveSession(delta:number, date_now, str_date){
		
		this.devicehw.setRoute(this.cRoute);
		this.devicehw.rndLatLonRoute(this.cRoute,10);
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
				this.devicehw.setConfigFile(this.cDevice,this.cRoute,this.cPersonal,this.cAssignment,this.cSession,delta,date_now, str_date);
				this.devicehw.findTarget();
			},(err:any)=>{

			}
		);
	}
	stop(){
		clearInterval(this.handled);
	}
}
