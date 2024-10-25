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
@Component({
  selector: 'app-devices',
  standalone: true,
  providers: [BsModalService],
  imports: [CommonModule, FormsModule, ReactiveFormsModule,QrCodeModule],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css'
})
//TREBOL-15 Para verificación servicio de control de sesiones
export class DevicesServiceComponent implements OnInit {
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

	personals: any[];
	personalType: any[];
	personalFiltred: any[];
	sessions: any[];
	sessionsFiltred

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
	keys(obj){
		return Object.keys(obj);
	}
	load(){
		this.personalApi.getAll2(100, 1, 'id',false,'').subscribe((res: any) => {
			this.personals = res.content;
			this.personalFiltred = this.personals;
			//this.taskerImage(this.personals,0);
			
			console.log("this.personals",this.personals);
		});
		this.personaltypeService.getAll().subscribe((res:any)=>{
			this.personalType = res.content;
			console.log("this.personalType",this.personalType);
		});
		this.scheduleService.getAll().subscribe((res:any)=>{
			this.Schedules = res.content;
			console.log("this.Schedules",this.Schedules);
		});
		this.wsapiService.getDevices().subscribe((devicesResult:any)=>{
			console.log("this.wsapiService",devicesResult);
			devicesResult.devices.forEach((device:any) => {
			});
			
		});
	}
}