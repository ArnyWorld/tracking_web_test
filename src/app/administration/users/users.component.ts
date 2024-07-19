import { Component, OnInit, TemplateRef } from '@angular/core';

import { UsuariosService } from '../../api/users.service';

import { CommonModule } from '@angular/common';

import { ModalModule } from 'ngx-bootstrap/modal';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
	selector: 'app-users',
	standalone: true,
	providers: [BsModalService],
	imports: [CommonModule, FormsModule, ReactiveFormsModule],
	templateUrl: './users.component.html',
	styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
	modalRef?: BsModalRef;
	constructor(
		private usuariosApi: UsuariosService, private modalService: BsModalService
	) { }

	user = {
		id: '',
		nombre: '',
		clave: '',
		clave2: '',
		estado: 'habilitado',
	};

	default = {
		id: '',
		nombre: '',
		clave: '',
		clave2: '',
		estado: 'habilitado',
	}

	Users: any[];
	ngOnInit(): void {
		this.loadUsuarios();
	}
	openModal(template: TemplateRef<void>, data?:any) {
		if (data){
			this.user = Object.assign({}, data);
		}else{			
			this.user = Object.assign({}, this.default);
		}
		this.modalRef = this.modalService.show(template, {
			class: 'modal-dialog-centered',
		});
	}
	loadUsuarios(){
		this.usuariosApi.getAll(100, 1, 'id',false,'').subscribe((res: any) => {
			console.log("UsersComponent.ngOnInit.res", res);
			this.Users = res.content;
		});
	}
	closeModal() {
		this.modalRef.hide();
	}
	editUsuario(form: any): void{
		if (form.valid && this.user.clave == this.user.clave2) {
			//console.log('Form data:', this.user);
			this.usuariosApi.update(this.user,this.user.id).subscribe((res: any) => {
				console.log(res);
				this.loadUsuarios();
				this.closeModal();
			});
		}
	}
	deleteUsuario(form: any): void {
		//console.log('Form data:', this.user);
		this.usuariosApi.delete(this.user.id).subscribe((res: any) => {
			console.log(res);
			this.loadUsuarios();
			this.closeModal();
		});
	}
	
	saveUsuario(form: any): void {
		if (form.valid && this.user.clave == this.user.clave2) {
			//console.log('Form data:', this.user);
			this.usuariosApi.register(this.user).subscribe((res: any) => {
				console.log(res);
				this.loadUsuarios();
				this.closeModal();
			});
		}
	}
}
