import { Component, OnInit, TemplateRef } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ModalModule } from 'ngx-bootstrap/modal';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PersonalService } from '../../api/personal.service';
import { RoutesService } from '../../api/routes.service';
import { AssignmentsService } from '../../api/assignments.service';
import { QrCodeModule } from 'ng-qrcode';
import { ImagesService } from '../../api/images.service';
import { environment } from '../../../environments/environment';
import { ScheduleService } from '../../api/schedule.service';
import { PersonaltypeService } from '../../api/jobroutes.services';
import { SessionsService } from '../../api/sessions.service';
import { WSapiService } from '../../api/wsapi.service';
import { DevicesService } from '../../api/devices.service';
@Component({
  selector: 'app-devices',
  standalone: true,
  providers: [BsModalService],
  imports: [CommonModule, FormsModule, ReactiveFormsModule,QrCodeModule],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css'
})
//TREBOL-15 Para verificación servicio de control de sesiones
export class DevicesComponent implements OnInit {
	modalRef?: BsModalRef;
	constructor(
		private personalApi: PersonalService,
		private sessionsService: SessionsService,
		private personaltypeService: PersonaltypeService,
		private AssignmentsService: AssignmentsService,
		private AssignmentsPersonalService: AssignmentsService,
		private routesService: RoutesService, 
		private modalService: BsModalService,
		private imagesService: ImagesService,
		private scheduleService: ScheduleService,
		private deviceService: DevicesService,
		private wsapiService: WSapiService,
	) { }
	serverApi = environment.apiserver;
	personal = {
		id: '',
		name: '',
		code: '',
		image_id: '',
		image: null,
		personal_type_id: '',		
		schedule_id:1,
	};
	Schedules = [];
	Assignments = [];

	keyword="";
	countSession=0;

	personals: any[];
	personalType: any[];
	personalFiltred: any[];
	sessions: any[];
	sessionsFiltred
	dbDevices: any[];
	noDevices= [];
	devices: any[];
	devicesFilter: any[];

	ngOnInit(): void {		
		this.load();
	}
	filtrar(){
		if (this.keyword == "") {this.personalFiltred = this.personals; return;}
		if (this.keyword.length < 3) return;
		this.personalFiltred = this.personals.filter( (p:any)=>{
			return p.name.toLowerCase().includes(this.keyword.toLowerCase());
		});
	}
	registerAll(){
		let syncDevices = [];
		this.devices.forEach((device:any)=>{
			let syncDevice = {
				id:device.id,
				info_brand:device.config['INFO_BRAND'],
				info_device:device.config['INFO_DEVICE'],
				info_manufacturer:device.config['INFO_MANUFACTURER'],
				info_model:device.config['INFO_MODEL'],
				info_product:device.config['INFO_PRODUCT'],
				info_serial:device.config['INFO_SERIAL'],
				config_internettest:device.config['CONFIG_INTERTEST'],
				config_livecapture:device.config['CONFIG_INTERTEST'],
				config_paramupdate:device.config['CONFIG_INTERTEST'],
				config_saveoffline:device.config['CONFIG_INTERTEST'],
				config_saveonline:device.config['CONFIG_INTERTEST'],
				config_serverapi:device.config['CONFIG_INTERTEST'],
				config_servertrack:device.config['CONFIG_INTERTEST'],
				config_trackcapture:device.config['CONFIG_INTERTEST'],
				config_updatestatus:device.config['CONFIG_INTERTEST'],
				registred:true,
				registred_date:Date.now(),
				last_connect:Date.now(),
				first_connect:Date.now(),
			}
			syncDevices.push(syncDevice);
			console.log('registrando.device ', syncDevice)
			this.deviceService.registerSync(syncDevice).subscribe((res:any)=>{
				console.log('registerAll.registerSync.res: ', res);
			})
		});
		
	}
	keys(obj){
		return Object.keys(obj);
	}
	load(){
		this.deviceService.getAll().subscribe( (dbDevicesResult:any)=>{
			this.dbDevices = dbDevicesResult.content;
			console.log("dbDevices",this.dbDevices);
				this.personalApi.getAll2().subscribe((res: any) => {
					this.personals = res.content;
					this.personalFiltred = this.personals;
					//this.taskerImage(this.personals,0);
					
					console.log("this.personals",this.personals);
					this.wsapiService.getDevices().subscribe((devicesResult:any)=>{
						console.log("this.wsapiService",devicesResult);						
						this.devices = devicesResult.devices;
						this.devices.forEach((device:any) => {
							device['personal'] = this.personals.find(p=>p.id==device.states['ID_USER']);
							let registredDevice = this.dbDevices.find(d=> d.id == device.id);
							if (registredDevice == undefined )
								this.noDevices.push(device);
							else
								this.countSession++;
						});
						
					});
				});
			});
		
		this.personaltypeService.getAll().subscribe((res:any)=>{
			this.personalType = res.content;
			console.log("this.personalType",this.personalType);
		});
		this.scheduleService.getAll().subscribe((res:any)=>{
			this.Schedules = res.content;
			console.log("this.Schedules",this.Schedules);
		});
		
	}
}