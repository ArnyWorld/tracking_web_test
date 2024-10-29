import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  selector: 'app-device-config',
  templateUrl: './modal-device-config.component.html',
  styleUrl: './modal-device-config.component.css'
})

export class ModalDeviceConfigComponent implements OnInit {
	@Output() onClose = new EventEmitter<string>();
	@Input() device:any;
	@Input() configs:any;
	
	
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
	createProgress="Enviar";
	ngOnInit(): void {
		
	}
	importData:any = {
		text : "",
		json: "",
		devices : []
	} 

	closeModal(){
		this.onClose.emit();
	}
	send(){

	}
}
