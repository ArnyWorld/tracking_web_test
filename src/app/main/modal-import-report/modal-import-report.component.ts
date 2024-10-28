import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';
import { PersonalService } from '../../api/personal.service';
import { PersonsService } from '../../apipersonal.service.ts/persons.services';
import { JobroutesService } from '../../apipersonal.service.ts/jobroutes.services';

import olMapScreenshot from 'ol-map-screenshot';
import { transform, fromLonLat } from 'ol/proj';
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
	@ViewChild('mapPrint') mapPrint: MapComponent;
	img1: any;
	img2: any;
	img3: any;
	@Input() device?:any;

	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private jobroutesService: JobroutesService,
		private routesService: RoutesService,
		private pointsService: PointsService,
		private districtPointsService: DistrictPointsService,){};

		jobroutes:any = [];
	ngOnInit(): void {
		setTimeout(() => {
			this.centerMap();	
			this.loadScreens();
		}, 200);
		
	}
	loadScreens(){
		this.mapRouteShow = true;
		this.mapCheckShow = false;
		this.mapTrackShow = false;
		setTimeout(async () => {			
			const screenRoute = await olMapScreenshot.getScreenshot(this.mapPrint.instance, {
				//scaleBarLength: 100,
				resolution: 85,
				showDisplayScale:false,
				format: 'jpeg',
			});
			this.img1=screenRoute.img;
			 this.thumbb64Route = await this.routesService.resizeImage(screenRoute.img);
			 this.mapRouteShow = false;
			 this.mapCheckShow = true;
			 this.mapTrackShow = false;
		},1000);

		setTimeout(async () => {
			const screenCheck = await olMapScreenshot.getScreenshot(this.mapPrint.instance, {
				//scaleBarLength: 100,
				resolution: 85,
				showDisplayScale:false,
				format: 'jpeg',
			});
			this.img2=screenCheck.img;

			this.thumbb64Check = await this.routesService.resizeImage(screenCheck.img);
			
			this.mapRouteShow = false;
			this.mapCheckShow = false;
			this.mapTrackShow = true;
		}, 2000);

		setTimeout(async () => {
			const screenTrack = await olMapScreenshot.getScreenshot(this.mapPrint.instance, {
				//scaleBarLength: 100,
				resolution: 85,
				showDisplayScale:false,
				format: 'jpeg',
			});
			this.img3=screenTrack.img;
			this.thumbb64Track = await this.routesService.resizeImage(screenTrack.img);
		},3000);	
	}
	zoom: number = 18;
	 thumbb64Route;
	 thumbb64Check;
	 thumbb64Track;
	mapRouteShow=true;
	mapTrackShow=true;
	mapCheckShow=true;
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
		/*const doc = new jsPDF({
			orientation: "landscape",
			unit: "px",
			//format: [4, 2]
		  });*/
		  
		const doc  = new jsPDF('l', 'px', 'letter');
		//doc.setFont('PTSans'); 
		doc.setFontSize(10); 
		
		  
			doc.addImage(this.thumbb64Route, 'jpeg', 20, 20,  270, 190);
			doc.addImage(this.thumbb64Check, 'jpeg', 300, 20,  270, 190);
			doc.addImage(this.thumbb64Track, 'jpeg', 20, 230,  270, 190);

			doc.text("Ruta designada", 20, 15);  
			doc.text("Ruta completada", 320, 15);
			doc.text("Trayecto recorrido ", 20, 225);  


			doc.setFontSize(12); 
			
			doc.text("Nombre: " + this.device.personal.name, 350, 285);
			doc.text("Ruta: " + this.device.routeSelected.name, 350, 295);
			doc.text("Completado: " + this.device.states['COMPLETED'] + '%', 350, 305);  
			//doc.text("Hello world!", 10, 10);  
			doc.save("report.pdf"); 
	}
	centerMap(){
		console.log("this.device.routeSelected",this.device.routeSelected);
		const extent = this.device.routeSelected.extend;		
		const corner1 = transform([extent[0],extent[1]], 'EPSG:4326', 'EPSG:3857');
		const corner2 = transform([extent[2],extent[3]], 'EPSG:4326', 'EPSG:3857');
		const extent3857 = [corner1[0],corner1[1],corner2[0],corner2[1]];
		console.log("extent3857",extent3857);
	/*	this.mapRoute.instance.getView().fit(extent3857, {
			maxZoom: 18,
			padding:[50,50,50,50],
			duration: 300
		});	
		this.mapCheck.instance.getView().fit(extent3857, {
			maxZoom: 18,
			padding:[50,50,50,50],
			duration: 300
		});	
		this.mapTrack.instance.getView().fit(extent3857, {
			maxZoom: 18,
			padding:[50,50,50,50],
			duration: 300
		});*/	
		this.mapPrint.instance.getView().fit(extent3857, {
			maxZoom: 18,
			padding:[50,50,50,50],
			duration: 300
		});	
		
	}
}
