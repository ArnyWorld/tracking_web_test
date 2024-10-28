import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';
import { PersonalService } from '../../api/personal.service';
import { PersonsService } from '../../apipersonal.service.ts/persons.services';
import { JobroutesService } from '../../apipersonal.service.ts/jobroutes.services';

import olMapScreenshot from 'ol-map-screenshot';
import * as olSphere from 'ol/sphere';

import { jsPDF } from "jspdf";
import { MapComponent } from 'ng-openlayers';
//declare var jsPDF: any;
declare var $:any;
//const { jsPDF } = window.jspdf;

@Component({
  selector: 'app-modal-report',
  templateUrl: './modal-import-report.component.html',
  styleUrl: './modal-import-report.component.css'
})

export class ModalImportReportComponent implements OnInit {
	@ViewChild('mapRoute') mapRoute: MapComponent;
	@ViewChild('mapCheck') mapCheck: MapComponent;
	@ViewChild('mapTrack') mapTrack: MapComponent;
	@Input() device?:any;

	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private jobroutesService: JobroutesService,
		private routesService: RoutesService,
		private pointsService: PointsService,
		private districtPointsService: DistrictPointsService,){};

		jobroutes:any = [];
	ngOnInit(): void {
		
	}
	zoom: number = 18;
	importData:any = {
		text : "",
		json: "",
		routes : [],
		districts:[],
	} 

	closeModal(){
		this.onClose.emit();
	}
	printPdf(){		
		const doc = new jsPDF({
			orientation: "landscape",
			unit: "px",
			//format: [4, 2]
		  });


		setTimeout(async () => {
			const response = await olMapScreenshot.getScreenshot(this.mapRoute.instance, {
				//scaleBarLength: 100,
				resolution: 85,
				format: 'jpeg',
			});
			let thumbb64 = await this.routesService.resizeImage(response.img);
			
			doc.addImage(thumbb64, 'jpeg', 20, 20,  290, 190);
			doc.addImage(thumbb64, 'jpeg', 320, 20,  290, 190);
			doc.addImage(thumbb64, 'jpeg', 20, 220,  290, 190);
//			deferred.resolve(doc.output('datauristring'));

			//doc.text("Hello world!", 10, 10);
			doc.save("report.pdf"); // will save the file in the current working directory
		}, 200);

	}

}
