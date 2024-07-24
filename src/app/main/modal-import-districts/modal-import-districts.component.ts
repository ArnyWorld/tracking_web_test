import { Component, EventEmitter, Output } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';

@Component({
  selector: 'app-modal-import-districts',
  templateUrl: './modal-import-districts.component.html',
  styleUrl: './modal-import-districts.component.css'
})

export class ModalImportDistrictsComponent {
	@Output() onClose = new EventEmitter<string>();
	
	constructor(
		private districtsService: DistrictsService,
		private districtPointsService: DistrictPointsService,){};

	importData:any = {
		text : "",
		json: "",
		districts : []
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
				};
				if (districtName != undefined)
					importData.districts.push(district);
			} );
			console.log("importData",importData);
			
		};
    	reader.readAsText(file);
	}
	saveOnDb(){
		this.registerCount = 0;
		this.saveDistrict(this.importData.districts,0);
	}
	saveDistrict(districts:[],index:number) {
		
		this.districtsService.register(districts[index]).subscribe((result: any) => {
			console.log("result", result);

			if ( result.content instanceof Array)
				this.savePoints(result.content[0],()=>{ if (index < districts.length) this.saveDistrict(districts,index+1);	});
			else
				this.savePoints(result.content,()=>{ if (index < districts.length) this.saveDistrict(districts,index+1); });
			
		});
	}
	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Guardar';

	savePoints(contentDistrict: any,callback) {
		this.regPoint(0,contentDistrict,callback);
	}
	regPoint(index,contentDistrict:any,callback){
		if (contentDistrict.points.length == index ){ 
			this.createProgress = "Completado";
			callback();
			return;
		}
		this.registerCount++;
		this.createProgress = "Guardando " + Math.round((this.registerCount/this.registerComplete)*100) + "%";
		//console.log(this.createProgress);
		let coord = contentDistrict.points[index];
		let punto = {
			district_id: contentDistrict.id,
			lat: coord[1],
			lon: coord[0]
		}
		this.districtPointsService.register(punto).subscribe((result: any) => {
			console.log("punto creado result:", result)
			this.regPoint(index+1,contentDistrict,callback);			
		});
	}
}
