import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';
import { PersonalService } from '../../api/personal.service';
import { PersonsService } from '../../apipersonal.service.ts/persons.services';
import { JobroutesService } from '../../apipersonal.service.ts/jobroutes.services';

@Component({
  selector: 'app-modal-import-routes',
  templateUrl: './modal-import-routes.component.html',
  styleUrl: './modal-import-routes.component.css'
})

export class ModalImportRoutesComponent implements OnInit {
	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private personalService: PersonalService,
		private personsService: PersonsService,
		private jobroutesService: JobroutesService,
		private routesService: RoutesService,
		private pointsService: PointsService,

		private districtPointsService: DistrictPointsService,){};

		jobroutes:any = [];
	ngOnInit(): void {
		this.jobroutesService.getAll().subscribe(
			(res:any)=>{
				this.jobroutes = res.content;
				console.log("jobroutes",this.jobroutes);
				this.jobroutes.forEach(r=>{
					r['snap_road'] = JSON.parse(r['snap_road']);						
					let points = [];
					r['snap_road'].features.forEach( (f,ind) =>{
						f.geometry.coordinates.forEach( c => {
							points.push([c[0],c[1],ind]);
						});
					});
					r['points'] = points;
				});
						
			}
		);
	}
	importData:any = {
		text : "",
		json: "",
		routes : [],
		districts:[],
	} 

	closeModal(){
		this.onClose.emit();
	}
	readFile(event:any,importData:any){
		const file = event.target.files[0];
		const reader = new FileReader();
		//reader.readAsDataURL(file);
		reader.onload = () => {
			//console.log(reader.result.toString());
			importData.text = reader.result.toString();
			importData.json = JSON.parse(importData.text);			

			console.log("importData.json",importData.json);
			this.registerComplete = 0;
			importData.json.features.forEach( (feature:any)=>{
				//var rxColor = new RegExp("(?<=\<tr bgcolor\=\"\#)[A-F0-9]{6}","i");
				//var rxDistance = new RegExp("(?<=\<td\>LONG\<\/td>)[0-9\,\<\>td\n]*","i");
				var districtName = feature.properties.c_dist_mun;
				var fillColor = '#ffffff';
				if ( typeof feature.properties['_umap_options'] != 'undefined')
					fillColor = feature.properties._umap_options.fillColor;

				var strokeColor = feature.properties.stroke;
				var points = [];
				feature.geometry.coordinates.forEach( (c:any, index:number) => {
					c.forEach(p =>{
						points.push( [p[0],p[1],index] );
						this.registerComplete ++;
					})
					
				});
				var district = {
					name : districtName,
					color : fillColor,					
					points : points,
					order : this.getOrder(districtName),
				};
				if (districtName != undefined && districtName != "")
					importData.districts.push(district);
			} );
			importData.districts = importData.districts.sort((a:any,b:any)=>{
				if (a.order<b.order) return -1;
				if (a.order>b.order) return 1;
				return 0;
			});
			console.log("importData",importData);
			
		};

    	reader.readAsText(file);
	}
	getOrder(name){
		if (name == "Distrito 1") return 1;
		if (name == "Distrito 2") return 2;
		if (name == "Distrito 3") return 3;
		if (name == "Distrito 4") return 4;
		if (name == "Distrito 5") return 5;
		if (name == "Distrito 6") return 6;
		if (name == "Distrito 7") return 7;
		if (name == "Distrito 8") return 8;
		if (name == "Distrito 9") return 9;
		if (name == "Distrito 10") return 10;
		if (name == "Distrito 11") return 11;
		if (name == "Distrito 12") return 12;
		if (name == "Distrito 13") return 13;
		if (name == "Distrito 14") return 14;
		if (name == "Distrito 15") return 15;
		return 0;
	}
	saveOnDb(){
		this.registerCount = 0;
		this.saveRoute(this.jobroutes,0);
	}
	saveRoute(jobroutes:any,index:number) {
		console.log(jobroutes[index]);
		let route = {
            "name": jobroutes[index].code,
            "description": "",
            "image_id": null,
            "min_split_mt": 5,
            "max_split_mt": 10,
            "frequency": jobroutes[index].frequency,
            "distance": jobroutes[index].distance,
            "create_date": jobroutes[index].created_at,
            "update_date": null,
            "district_id": jobroutes[index].section_id,
            "color": jobroutes[index].color,
		};
		this.routesService.register(route).subscribe((result: any) => {
			console.log("registrado",result);
			jobroutes[index]['id'] = result.content.id;
			this.savePoints(jobroutes[index],()=>{ if (index < jobroutes.length) this.saveRoute(jobroutes,index+1); });
		});
		/*
		this.districtsService.register(districts[index]).subscribe((result: any) => {
			console.log("result", result);

			if ( result.content instanceof Array)
				this.savePoints(result.content[0],()=>{ if (index < districts.length) this.saveDistrict(districts,index+1);	});
			else
				this.savePoints(result.content,()=>{ if (index < districts.length) this.saveDistrict(districts,index+1); });
			
		});*/
	}
	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Guardar';

	savePoints(jobroute: any,callback) {
		this.regPoint(0,jobroute,callback);
	}
	regPoint(index,jobroute:any,callback){
		console.log("jobroute",jobroute);
		if (jobroute.points.length == index+1 ){ 
			this.createProgress = "Completado";
			callback();
			return;
		}
		this.registerCount++;
		this.createProgress = "Guardando " + Math.round((this.registerCount/this.registerComplete)*100) + "%";
		//console.log(this.createProgress);
		let coord = jobroute.points[index];
		let punto = {
			route_id: jobroute.id,
			section: coord[2],
			lat: coord[1],
			lon: coord[0],
		}
		this.pointsService.register(punto).subscribe((result: any) => {
			console.log("punto creado result:", result)
			this.regPoint(index+1,jobroute,callback);			
		});
	}
}
