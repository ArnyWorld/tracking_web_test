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
import { RegpersonalService } from '../../api_regpersonal/regpersonal.services';

@Component({
  selector: 'app-modal-import-personal-registro',
  templateUrl: './modal-import-personal-registro.component.html',
  styleUrl: './modal-import-personal-registro.component.css'
})

export class ModalImportPersonalRegistroComponent implements OnInit {
	@Output() onClose = new EventEmitter<string>();
	public regpersonalService:RegpersonalService;
	constructor(
		private personalService: PersonalService,
		private personsService: PersonsService,
		private routesService: RoutesService,		
		private assignmentsService : AssignmentsService,
		private personaltypeService: PersonaltypeService,
		private districtPointsService: DistrictPointsService){
			this.regpersonalService = new RegpersonalService();
		};

	persons:any = [];
	personal:any = [];
	routes:any = [];
	personalTypes:any = [];
	registros = [];
	ngOnInit(): void {
		this.personsService.getAll().subscribe(
			(res:any)=>{
				this.persons = res.content;
				console.log("this.persons",this.persons);
			}
		);
		this.personalService.getAll(1000,1,'id',false).subscribe(
			(res:any)=>{
				this.personal = res.content;
				console.log("this.personal",this.personal);
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
		districts : []
	} 
	setCredential(user,password){
		//console.log("user.value",user.value);
		this.regpersonalService.setCredentials(user.value,password.value);		
	}
	loadRegs(){
		
		this.regpersonalService.getAll().subscribe(
			(res:any)=>{
				console.log("this.regpersonalService.res:",res);
				this.registros = res;
				this.registros.forEach(p=>{
					p.person.check=false;
				});
			}
		);
	}
	closeModal(){
		this.onClose.emit();
	}
	readFile(event:any,importData:any){

	}
	saveOnDb(){
		this.registerCount = 0;
		this.savePerson(this.registros,0);
	}
	
	updateOnDb(){
		this.registerCount = 0;
		this.registerComplete = this.persons.length;
		this.updatePerson(this.persons,0);
	}
	updatePerson(persons:any,index:number) {		
		this.registerCount++;
		this.updateProgress = "Actualizando " + Math.round((this.registerCount/this.registerComplete)*100) + "%";

		let person = persons [index];
		console.log("person",person);
		let p = (cadena:any) =>{
			if (cadena == null) return "";
			if (cadena == undefined) return "";
			if (cadena == " ") return "";
			return cadena;
		};
		let id = '';

		let personal = this.personal.find( p =>  p.code == person.code);
		//console.log("code ", this.personal, person.code.trim());
		if (personal == undefined){
			if (index < persons.length) this.updatePerson(persons, index+1);
			return;
		}
		let updatePerson = {
            "name": (`${p(person.names)} ${p(person.last_name_1)} ${p(person.last_name_2)} ${p(person.last_name_3)}`).replaceAll("-","").replaceAll(".","").replaceAll("  "," ").trim(),
			"firstname": (`${p(person.names)}`).replaceAll("-","").replaceAll(".","").replaceAll("  "," ").trim(),
			"lastname": (`${p(person.last_name_1)} ${p(person.last_name_2)} ${p(person.last_name_3)}`).replaceAll("-","").replaceAll(".","").replaceAll("  "," ").trim(),
			"gender": person.gender_id,
		};
		console.log("personal.id",personal.id);
		this.personalService.update(updatePerson, personal.id).subscribe((result: any) => {
			console.log("updated",result);
			//persons[index]['id'] = result.content.id;
			if (index < persons.length) this.updatePerson(persons, index+1);
			else this.updateProgress = "Completado"
		});
	}
	savePerson(registros:any,index:number) {
		if (index >= registros.length) { this.createProgress = "Guardado" ;return; }
		let person = registros [index].person;
		let personalTypeId = this.personalTypeId;
		let p = (cadena:any) =>{
			if (cadena == null) return "";
			if (cadena == undefined) return "";
			if (cadena == " ") return "";
			return cadena;
		};
		if (!registros[index].person.check){
			if (index < registros.length) 
				this.savePerson(registros,index+1);
			return;
		}

		console.log("person",person);
		let newPerson = {
            "name": (`${p(person.names)} ${p(person.last_name_1)} ${p(person.last_name_2)} ${p(person.last_name_3)}`).replaceAll("  "," ").trim(),
            "code":  person.document_number,
            "image_id": null,
            "personal_type_id": personalTypeId,
			"schedule_id": "1",
			"firstname": person.names,
			"lastname": (`${p(person.last_name_1)} ${p(person.last_name_2)} ${p(person.last_name_3)}`).replaceAll("  "," ").trim(),
			"gender": person.gender_id,
            "create_date": 1719099774,
            "update_date": 1719599774,
		};
		this.personalService.register(newPerson).subscribe((result: any) => {
			console.log("registrado",result);
			
			registros[index]['id'] = result.content.id;
			registros[index].person['id'] = result.content.id;
			this.saveAssignments(registros[index],()=>{ if (index < registros.length) this.savePerson(registros,index+1); });
		});
	}

	registerCount = 0;
	registerComplete = 0;
	createProgress = 'Guardar';
	updateProgress = 'Actualizar';
	routePersonsId ;
	personalTypeId = 0;

	saveAssignments(contentPerson: any,callback) {
		this.regAssignment(0,contentPerson,callback);
	}
	regAssignment(index,contentPerson:any,callback){
		console.log("contentPerson",contentPerson);
	
		this.registerCount++;
		this.createProgress = "Guardando " + Math.round((this.registerCount/this.registerComplete)*100) + "%";
		//console.log(this.createProgress);
		//let personroutes = contentPerson.personroutes[index];
		//let route = this.routes.find( r=> r.name.trim() == personroutes['job_routes'].code.trim() );
		/*if (route == undefined){
			console.log("personroutes['job_routes']",personroutes['job_routes']);
			throw "personroutes['job_routes']";
		}
		*/
		let routeId =	this.routePersonsId;
		console.log("routeId", routeId);
		let assignment = {
			personal_id: contentPerson.id,
			route_id: routeId,
			schedule_id: 1,
		}
		console.log("assignment",JSON.stringify(assignment));
		this.assignmentsService.register(assignment).subscribe((result: any) => {
			console.log("asignacion creada result:", result)
			callback();
		});
	}
}
