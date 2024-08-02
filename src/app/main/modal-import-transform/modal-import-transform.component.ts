import { Component, EventEmitter, Output } from '@angular/core';
import { RoutesService } from '../../api/routes.service';
import { PointsService } from '../../api/points.service';
import { DistrictsService } from '../../api/districts.service';
import { DistrictPointsService } from '../../api/districtspoints.service';

@Component({
  selector: 'app-modal-import-transform',
  templateUrl: './modal-import-transform.component.html',
  styleUrl: './modal-import-transform.component.css'
})

export class ModalImportTransformComponent {
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
	toSqlType(data_type){
		if(data_type == "uuid") return "uuid";
		if(data_type == "jsonb") return "string";
		if(data_type == "date") return "date";
		if(data_type == "timestamp without time zone") return "date";
		if(data_type == "json") return "string";
		if(data_type == "boolean") return "boolean";
		if(data_type == "character varying") return "string";
		if(data_type == "time without time zone") return "time";
		if(data_type == "text") return "string";
		if(data_type == "integer") return "number";
		if(data_type == "numeric") return "number";
		if(data_type == "bigint") return "number";
		if(data_type == "double precision") return "number";
		return "xxx";
	}
	toField(table, table_name:string,column_name:string,data_type:any, foreigns:any, primarykeys:any){
		let field = "";
		let attributes = [];
		let is_rel = false;
		//attributes.push(this.toSqlType(data_type));
		let name = this.toSqlType(data_type);
		let pk = primarykeys.find(k=>(k.table_name == table_name && k.column_name == column_name));
		let rel = foreigns.find(f=>(f.crelname == table_name && f.child_column == column_name));
		
		//if (pk!=null) attributes.push("pk");
		if (pk!=undefined) pk="pk";
		else pk = "";

		if (rel!=undefined){
			table[`${rel.parent_table}`] = `[${rel.parent_table}|${rel.parent_column}|${rel.child_column}]`;
			is_rel = true;
		}

		if (is_rel){
			return `${name}`;
		}else{
			return `${name}${pk!=''?'|'+pk:""}`;
		}
		
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

			/*let tables = importData.json.tables.map( (t:any) => { return {
				"name" : t.table_name, 
				"fields": [],
				"foreign": []}});
			*/
			let tables = {};
			importData.json.tables.forEach( (t:any) => { 
				tables[t.table_name] = {};
			});
			importData.json.columns.forEach( (c:any) => {
				tables[c.table_name][c.column_name] = this.toField(tables[c.table_name],c.table_name,c.column_name,c.data_type,importData.json.foreigns,importData.json.primarykeys);
				
			});
		
			console.log("tables",tables);
			let codeApimaster= "";
			codeApimaster += "\tdatabase_name\n";
			Object.keys(tables).forEach( (table_name:any) => { 
				let table_values = tables[table_name];
				codeApimaster += `\t\t${table_name}\n`;
				Object.keys(table_values).forEach(f=>{
					codeApimaster += `\t\t\t${f}:${table_values[f]}\n`;
				});
				codeApimaster += `\n`;
			});
			importData.text = codeApimaster;
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
