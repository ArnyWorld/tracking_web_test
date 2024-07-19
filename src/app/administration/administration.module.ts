import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdministrationRoutingModule } from './administration-routing.module';
import { UsersComponent } from './users/users.component';

@NgModule({
  declarations: [  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdministrationRoutingModule,
  ]
})
export class AdministrationModule { }
