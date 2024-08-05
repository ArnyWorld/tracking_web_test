import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';
import { PersonalService } from '../../api/personal.service';
import { PersonsService } from '../../apipersonal.service.ts/persons.services';
import { Route } from '@angular/router';
import { PersonaltypeService } from '../../api/jobroutes.services';
import { AssignmentsService } from '../../api/assignments.service';
import { DevicesService } from '../../api/devices.service';

@Component({
  selector: 'app-modal-import-devices',
  templateUrl: './modal-import-devices.component.html',
  styleUrl: './modal-import-devices.component.css'
})

export class ModalImportDevicesComponent implements OnInit {
	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private personalService: PersonalService,
		private personsService: PersonsService,
		private routesService: RoutesService,
		private assignmentsService : AssignmentsService,
		private personaltypeService: PersonaltypeService,
		private devicesService: DevicesService,
		private districtPointsService: DistrictPointsService){};

	persons:any = [];
	routes:any = [];
	personalTypes:any = [];
	devicesNews:any = [];
	ngOnInit(): void {
		this.personsService.getAll().subscribe(
			(res:any)=>{
				this.persons = res.content;
				console.log("this.persons",this.persons);
			}
		);
		this.routesService.getAll(300,1,'id',false,'').subscribe(
			(res:any)=>{
				this.routes = res.content;
				console.log("this.routes",this.routes);
			}
		);
		this.personaltypeService.getAll().subscribe(
			(res:any)=>{
				this.personalTypes = res.content;
				console.log("this.personalTypes",this.personalTypes);
			}
		);
	}
	importData:any = {
		text : "",
		json: "",
		devices : []
	} 

	closeModal(){
		this.onClose.emit();
	}
	readFile(event:any,importData:any){
		const file = event.target.files[0];
		const reader = new FileReader();
		reader.onload = () => {
			//console.log(reader.result.toString());
			importData.text = reader.result.toString();
			//importData.json = JSON.parse(importData.text);			

			//console.log("importData.json",importData.json);
			this.registerComplete = 0;
			let lines = importData.text.split("\n");
			lines.forEach(l=>{
				let values = l.split(";");
				if (values.length<2) return;
				let device = {
					"id": Math.random().toString(36).slice(-8)+Math.random().toString(36).slice(-8),
					"info_brand": values[0],
					"info_device": values[1],
					"info_manufacturer": values[0],
					"info_model": values[1],
					"info_product": values[1],
					"info_serial": "Unknown",
					"info_fingerprint": "user/release-keys",
					"config_internettest": 1,
					"config_livecapture": 1,
					"config_paramupdate": 60,
					"config_saveoffline": 60,
					"config_saveonline": 60,
					"config_serverapi": "http://192.168.100.7:9988/trackingdb",
					"config_servertrack": "http://trackingserver.kernotec.com",
					"config_trackcapture": 3,
					"config_updatestatus": 30,
					"registred": "false",
					"registred_date": 1721422805820,
					"last_connect": 1721422805820,
					"first_connect": 1721422805820,
					order: Math.random(),			
				};
				let formDevice = {};
				/*Object.keys(device).forEach(k => {
					formDevice[k.toLowerCase()] = device[k];
				});*/
				this.devicesNews.push(device);
			});
			importData.devices = this.devicesNews;
			importData.devices = importData.devices.sort((a:any,b:any)=>{
				if (a.order<b.order) return -1;
				if (a.order>b.order) return 1;
				return 0;
			});
			console.log("this.devicesNews",this.devicesNews);

		
			console.log("importData",importData);
			
		};

    	reader.readAsText(file);
	}
	saveOnDb(){
		this.registerCount = 0;
		this.saveDevice(this.importData.devices,0);
	}
	saveDevice(devices:any,index:number) {
		let device = devices [index];
				
		this.devicesService.register(device).subscribe((result: any) => {
			console.log("registrado",result);
			//devices[index]['id'] = result.content.id;
			if (index < devices.length) this.saveDevice(devices,index+1);
		});
	
	}
	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Guardar';

	saveAssignments(contentPerson: any,callback) {
		this.regAssignment(0,contentPerson,callback);
	}
	regAssignment(index,contentPerson:any,callback){
		console.log("contentPerson",contentPerson);
		if (contentPerson.personroutes.length == 0) {			
			callback();
			return;
		}
		if (contentPerson.personroutes.length == index ){ 
			this.createProgress = "Completado";
			callback();
			return;
		}
		this.registerCount++;
		this.createProgress = "Guardando " + Math.round((this.registerCount/this.registerComplete)*100) + "%";
		//console.log(this.createProgress);
		let personroutes = contentPerson.personroutes[index];
		let route = this.routes.find( r=> r.name.trim() == personroutes['job_routes'].code.trim() );
		if (route == undefined){
			console.log("personroutes['job_routes']",personroutes['job_routes']);
			throw "personroutes['job_routes']";
		}

		
		let assignment = {
			personal_id: contentPerson.id,
			route_id: route.id,
			schedule_id: 1,
		}
		console.log("assignment",JSON.stringify(assignment));
		this.assignmentsService.register(assignment).subscribe((result: any) => {
			console.log("asignacion creada result:", result)
			this.regAssignment(index+1, contentPerson, callback);
		});
	}
}
